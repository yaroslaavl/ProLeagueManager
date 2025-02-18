package org.league.app.service;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.broker.*;
import org.league.app.database.entity.Match;
import org.league.app.database.entity.MatchPlayer;
import org.league.app.database.entity.enums.MatchStatus;
import org.league.app.database.repository.MatchPlayerRepository;
import org.league.app.database.repository.MatchRepository;
import org.league.app.dto.MatchReadDto;
import org.league.app.exception.*;
import org.league.app.feign.competitionClient.CompetitionClientFeign;
import org.league.app.feign.notificationClient.NotificationClientFeign;
import org.league.app.feign.notificationClient.NotificationDto;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.teamClient.TeamClientFeign;
import org.league.app.feign.teamClient.TeamFeignDto;
import org.league.app.feign.teamClient.TeamMemberFeignDto;
import org.league.app.mapper.MatchMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchMapper matchMapper;
    private final MatchRepository matchRepository;
    private final CompetitionClientFeign competitionClient;
    private final TeamClientFeign teamClient;
    private final SportClientFeign sportClient;
    private final MatchPublisher matchPublisher;
    private final NotificationClientFeign notificationClient;
    private final MatchPlayerRepository matchPlayerRepository;
    private List<UUID> activeTournamentsCache = new ArrayList<>();

    public MatchReadDto findMatchById(UUID id) {
        return matchRepository.findById(id)
                .map(matchMapper::toDto)
                .orElseThrow(() -> new MatchNotFoundException("Match not found"));
    }

    @Transactional
    public void generateTournamentFirstStageMatches(TournamentBracketDto dto) {
        generateEmptyTournamentMatches(dto);

        List<TournamentStageDto> stages = dto.getStageList();
        stages.sort(Comparator.comparingInt(TournamentStageDto::getStageOrder));
        List<Match> firstStageMatches = matchRepository.findMatchByStageId(stages.getFirst().getId());

        int participantsSize = dto.getCompetitionParticipantList().size();
        int bye = (int) (Math.pow(2, Math.ceil(Math.log(participantsSize) / Math.log(2))) - participantsSize);

        List<CompetitionParticipantDto> remainingParticipants = new ArrayList<>(dto.getCompetitionParticipantList());
        Collections.shuffle(remainingParticipants);

        List<Match> updatedMatches = new ArrayList<>();
        Map<UUID, Match> nextMatchMap = new HashMap<>();

        for (int i = 0; i < bye; i++) {
            CompetitionParticipantDto competitionParticipantDto = remainingParticipants.removeFirst();
            Match byeMatch = firstStageMatches.removeFirst();

            byeMatch.setTeamAId(competitionParticipantDto.getTeamId());
            byeMatch.setPlayerAId(competitionParticipantDto.getPlayerId());
            byeMatch.setMatchStatus(MatchStatus.BYE);
            byeMatch.setWinnerTeamId(competitionParticipantDto.getTeamId());
            byeMatch.setWinnerPlayerId(competitionParticipantDto.getPlayerId());
            byeMatch.setAConfirmed(true);
            byeMatch.setBConfirmed(false);

            if (byeMatch.getNextMatchId() != null) {
                Match nextMatch = matchRepository.findById(byeMatch.getNextMatchId())
                        .orElseThrow(() -> new MatchNotFoundException("Match not found"));

                if (nextMatch.getTeamAId() == null && nextMatch.getPlayerAId() == null) {
                    nextMatch.setTeamAId(competitionParticipantDto.getTeamId());
                    nextMatch.setPlayerAId(competitionParticipantDto.getPlayerId());
                    nextMatch.setMatchStatus(MatchStatus.WAITING_FOR_OPPONENT);
                } else {
                    nextMatch.setTeamBId(competitionParticipantDto.getTeamId());
                    nextMatch.setPlayerBId(competitionParticipantDto.getPlayerId());
                    nextMatch.setMatchStatus(MatchStatus.SCHEDULED);

                    if (nextMatch.getMatchDate() == null || nextMatch.getMatchDate().equals(byeMatch.getMatchDate())) {
                        nextMatch.setMatchDate(dto.getSport().getIsEsport()
                                ? byeMatch.getMatchDate().plusHours(3)
                                : byeMatch.getMatchDate().plusHours(24));
                    }
                }
                nextMatchMap.put(nextMatch.getId(), nextMatch);
            }
            updatedMatches.add(byeMatch);
        }

        for (int i = 0; i < remainingParticipants.size() - 1; i += 2) {
            CompetitionParticipantDto firstParticipant = remainingParticipants.get(i);
            CompetitionParticipantDto secondParticipant = remainingParticipants.get(i + 1);
            Match match = firstStageMatches.removeFirst();

            match.setTeamAId(firstParticipant.getTeamId());
            match.setPlayerAId(firstParticipant.getPlayerId());
            match.setTeamBId(secondParticipant.getTeamId());
            match.setPlayerBId(secondParticipant.getPlayerId());
            match.setMatchStatus(MatchStatus.SCHEDULED);
            match.setAConfirmed(false);
            match.setBConfirmed(false);

            updatedMatches.add(match);
        }

        Set<Match> uniqueMatches = new HashSet<>(updatedMatches);
        uniqueMatches.addAll(nextMatchMap.values());
        matchRepository.saveAll(uniqueMatches);
    }

    private void generateEmptyTournamentMatches(TournamentBracketDto dto) {
        List<TournamentStageDto> stages = dto.getStageList();
        stages.sort(Comparator.comparingInt(TournamentStageDto::getStageOrder));

        int lastStageIndex = stages.size() - 1;

        List<Match> emptyMatches = new ArrayList<>();
        List<Match> readyMatches = new ArrayList<>();

        for (TournamentStageDto currentStage : stages) {
            int matchesOnStage = (int) Math.pow(2, lastStageIndex - currentStage.getStageOrder() + 1);

            for (int j = 0; j < matchesOnStage; j++) {
                Match emptyMatch = Match.builder()
                        .competitionId(dto.getCompetition().getId())
                        .stageId(currentStage.getId())
                        .teamAId(null)
                        .teamBId(null)
                        .playerAId(null)
                        .playerBId(null)
                        .matchDate(null)
                        .matchStatus(MatchStatus.WAITING_FOR_OPPONENT)
                        .scoreA(0)
                        .scoreB(0)
                        .isOvertime(false)
                        .isDraw(false)
                        .winnerTeamId(null)
                        .winnerPlayerId(null)
                        .aConfirmed(false)
                        .bConfirmed(false)
                        .createdAt(LocalDateTime.now())
                        .updatedAt(LocalDateTime.now())
                        .nextMatchId(null)
                        .build();

                emptyMatches.add(emptyMatch);
            }
            matchRepository.saveAll(emptyMatches);

            List<Match> firstStageMatches = emptyMatches.stream()
                    .filter(match -> match.getStageId().equals(stages.getFirst().getId()))
                    .toList();

            LocalDateTime startDate = dto.getCompetition().getStartDate();

            if ((dto.getSport().getIsEsport() && stages.size() <= 5) || (!dto.getSport().getIsEsport() && stages.size() <= 4)) {
                for (Match match : firstStageMatches) {
                    match.setMatchDate(startDate);
                }
            } else {
                List<Match> firstMatchesHalf = firstStageMatches.subList(0, firstStageMatches.size() / 2);
                List<Match> secondMatchesHalf = firstStageMatches.subList(firstStageMatches.size() / 2, firstStageMatches.size());

                if (dto.getSport().getIsEsport()) {
                    for (Match match : firstMatchesHalf) {
                        match.setMatchDate(startDate);
                    }
                    for (Match match : secondMatchesHalf) {
                        match.setMatchDate(startDate.plusHours(3));
                    }
                } else {
                    for (Match match : firstMatchesHalf) {
                        match.setMatchDate(startDate);
                    }
                    for (Match match : secondMatchesHalf) {
                        match.setMatchDate(startDate.plusDays(1));
                    }
                }
            }
            readyMatches.addAll(firstStageMatches);
            matchRepository.saveAll(readyMatches);
        }

        List<Match> previousMatches = emptyMatches;
        for (int i = 1; i < stages.size(); i++) {
            TournamentStageDto currentStage = stages.get(i);
            List<Match> currentStageMatches = emptyMatches.stream()
                    .filter(m -> m.getStageId().equals(currentStage.getId()))
                    .toList();

            for (int j = 0; j < previousMatches.size(); j += 2) {
                if (j / 2 >= currentStageMatches.size()) {
                    log.error("Error: currentStageMatches (index={}, size={})", j / 2, currentStageMatches.size());
                    break;
                }
                Match nextMatch = currentStageMatches.get(j / 2);
                previousMatches.get(j).setNextMatchId(nextMatch.getId());
                matchRepository.save(previousMatches.get(j));

                if (j + 1 < previousMatches.size()) {
                    previousMatches.get(j + 1).setNextMatchId(nextMatch.getId());
                    matchRepository.save(previousMatches.get(j + 1));
                }
            }

            previousMatches = currentStageMatches;
        }
    }

    @Scheduled(fixedDelay = 45000)
    public void updateActiveTournamentsCache() {
        activeTournamentsCache = competitionClient.getActiveTournaments();
        log.info("Updated active tournaments cache: {}", activeTournamentsCache.size());
    }

    @Scheduled(fixedDelay = 30000)
    public void processScheduledTournamentMatches() {
        if (activeTournamentsCache.isEmpty()) {
            return;
        }

        List<Match> matchesByMatchStatus = matchRepository.findScheduledMatchesByActiveTournaments(activeTournamentsCache);
        log.info("Match confirmation check 5 minutes before the start of the match at {}", LocalDateTime.now());

        for (Match match : matchesByMatchStatus) {
            if (LocalDateTime.now().isAfter(match.getMatchDate().minusMinutes(5))) {
                checkMatchParticipantConfirmation(match);
            }

            if (LocalDateTime.now().isAfter(match.getMatchDate())
                    && match.getAConfirmed()
                    && match.getBConfirmed()
                    && match.getMatchStatus() != MatchStatus.AUTO_WIN) {
                match.setMatchStatus(MatchStatus.IN_PROGRESS);
                matchRepository.save(match);
            }

        }
    }

    @Scheduled(fixedDelay = 30000)
    public void changeTournamentMatchStatus() {
        if (activeTournamentsCache.isEmpty()) {
            return;
        }

        List<Match> matchesByMatchStatus = matchRepository.findInProgressMatchesByActiveTournamentId(activeTournamentsCache);
        log.info("Checking match winners at {}", LocalDateTime.now());

        for (Match match : matchesByMatchStatus) {
            if (match.getWinnerPlayerId() != null || match.getWinnerTeamId() != null) {
                processNextMatchAndFinishPrevious(match);
            }
        }
    }

    @Transactional
    public void processNextMatchAndFinishPrevious(Match match) {
        match.setMatchStatus(MatchStatus.FINISHED);
        matchRepository.save(match);

        processNextMatch(match);
    }

    @Transactional
    protected void checkMatchParticipantConfirmation(Match match) {
        Match matchById = matchRepository.findById(match.getId())
                .orElseThrow(() -> new MatchNotFoundException("Match not found"));

        if (matchById.getAConfirmed() && matchById.getBConfirmed()) {
            return;
        } else if (matchById.getAConfirmed()) {
            matchById.setWinnerTeamId(match.getTeamAId());
            matchById.setWinnerPlayerId(match.getPlayerAId());
            matchById.setMatchStatus(MatchStatus.AUTO_WIN);
        } else if (matchById.getBConfirmed()) {
            matchById.setWinnerTeamId(match.getTeamBId());
            matchById.setWinnerPlayerId(match.getPlayerBId());
            matchById.setMatchStatus(MatchStatus.AUTO_WIN);
        } else {
            int rand = new Random().nextInt(2);

            if (rand == 0) {
                matchById.setWinnerTeamId(match.getTeamAId());
                matchById.setWinnerPlayerId(match.getPlayerAId());
            } else {
                matchById.setWinnerTeamId(match.getTeamBId());
                matchById.setWinnerPlayerId(match.getPlayerBId());
            }
            matchById.setMatchStatus(MatchStatus.AUTO_WIN);
        }
        matchRepository.save(matchById);

        processNextMatch(matchById);
    }

    @Transactional
    public boolean matchConfirmation(UUID matchId, UUID teamId, Long userId, List<Long> playerIds) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new MatchNotFoundException("Match not found"));

        if ((teamId != null && !teamId.equals(match.getTeamAId()) && !teamId.equals(match.getTeamBId()))
                || (teamId == null && !userId.equals(match.getPlayerAId()) && !userId.equals(match.getPlayerBId()))) {
            throw new NotPartOfMatchException("This team or player is not part of the match");
        }

        boolean isSoloTournament = teamId == null;
        CompetitionDto competitionDto = competitionClient.findById(match.getCompetitionId());

        if (!isSoloTournament) {

            TeamFeignDto teamById = teamClient.findTeamById(teamId);

            TeamMemberFeignDto capitan = teamById.getTeamMembers().stream()
                    .filter(teamMemberFeignDto -> teamMemberFeignDto.getRoles().stream()
                            .anyMatch(teamRoleFeignDto -> teamRoleFeignDto.getRoleName().equalsIgnoreCase("CAPITAN")))
                    .findFirst()
                    .orElseThrow(() -> new PlayerNotFoundException("Capitan not found"));

            if (!capitan.getUserId().equals(userId)) {
                throw new UserIsNotCaptain("User is not a capitan");
            }

            List<CompetitionParticipantDto> competitionParticipantsById =
                    competitionClient.findCompetitionParticipantsById(match.getCompetitionId());

            Set<Long> allTeamPlayersIds = competitionParticipantsById.stream()
                    .map(CompetitionParticipantDto::getPlayerId)
                    .collect(Collectors.toSet());

            if (!allTeamPlayersIds.containsAll(playerIds)) {
                throw new PlayerNotFoundException("One or more selected players do not belong to this team");
            }

            List<MatchPlayer> matchPlayers = new ArrayList<>();

            String message = "Your team: " + teamById.getTeamName() +
                    " confirmed participation in the match. Match starts at: " + match.getMatchDate();

            for (Long playerId : allTeamPlayersIds) {
                MatchPlayer matchPlayer = MatchPlayer.builder()
                        .match(match)
                        .playerId(playerId)
                        .teamId(teamId)
                        .isStarting(playerIds.contains(playerId))
                        .build();

                sendNotificationMessage(playerId, message, "MATCH_CONFIRMED", competitionDto.getCompetitionType());
                matchPlayers.add(matchPlayer);
            }
            matchPlayerRepository.saveAll(matchPlayers);
        } else {
            MatchPlayer matchPlayer = MatchPlayer.builder()
                    .match(match)
                    .playerId(userId)
                    .teamId(null)
                    .isStarting(true)
                    .build();

            sendNotificationMessage(userId, "You've confirmed your participation in the match. Match starts at: " + match.getMatchDate(), "MATCH_CONFIRMED", competitionDto.getCompetitionType());
            matchPlayerRepository.save(matchPlayer);
        }

        if (!isSoloTournament) {
            if (teamId.equals(match.getTeamAId())) {
                match.setAConfirmed(true);
            } else if (teamId.equals(match.getTeamBId())) {
                match.setBConfirmed(true);
            }
        } else {
            if (userId.equals(match.getPlayerAId())) {
                match.setAConfirmed(true);
            } else if (userId.equals(match.getPlayerBId())) {
                match.setBConfirmed(true);
            }
        }

        matchRepository.save(match);
        return true;
    }

    public void generateLeagueMatches(String info) {
        log.info("Generating league matches");
        throw new RuntimeException("hahahaa");
    }

    private void processNextMatch(Match match) {
        if (match.getNextMatchId() == null) {
            String competitionId = match.getCompetitionId().toString();

            boolean success = matchPublisher.publishFinalizedCompetition(competitionId);

            if (!success) {
                log.error("Finalization of competition failed!");
                throw new FinalizeCompetitionException("Failed to finalize competition with id: " + competitionId);
            }

            CompetitionDto competition
                    = competitionClient.findById(match.getCompetitionId());

            if (match.getWinnerTeamId() == null) {
                sendNotificationMessage(match.getWinnerPlayerId(), "Congratulations! You won the competition!", "COMPETITION_WINNER", competition.getCompetitionType());
            } else {
                TeamFeignDto team = teamClient.findTeamById(match.getWinnerTeamId());

                Set<Long> winnersIds = team.getTeamMembers().stream()
                        .map(TeamMemberFeignDto::getUserId)
                        .collect(Collectors.toSet());

                for (Long playerId : winnersIds) {
                    sendNotificationMessage(playerId, "Congratulations! Your team won the competition!", "COMPETITION_WINNER", competition.getCompetitionType());
                }
            }

            return;
        }

        Match nextMatch = matchRepository.findById(match.getNextMatchId())
                .orElseThrow(() -> new MatchNotFoundException("Next match not found"));

        if (nextMatch.getTeamAId() == null && nextMatch.getPlayerAId() == null) {
            nextMatch.setTeamAId(match.getWinnerTeamId());
            nextMatch.setPlayerAId(match.getWinnerPlayerId());
            nextMatch.setMatchStatus(MatchStatus.WAITING_FOR_OPPONENT);
        } else {
            nextMatch.setTeamBId(match.getWinnerTeamId());
            nextMatch.setPlayerBId(match.getWinnerPlayerId());
            nextMatch.setMatchStatus(MatchStatus.SCHEDULED);
        }

        CompetitionDto competition = competitionClient.findById(nextMatch.getCompetitionId());
        SportDto sportById = sportClient.findSportById(competition.getSportId());

        if (nextMatch.getMatchDate() == null || nextMatch.getMatchDate().equals(match.getMatchDate())) {
            nextMatch.setMatchDate(sportById.getIsEsport()
                    ? match.getMatchDate().plusHours(3)
                    : match.getMatchDate().plusHours(24));
        }

        matchRepository.save(nextMatch);
    }

    private void sendNotificationMessage(Long userId, String message, String eventType, String notificationCategory) {
        NotificationDto notification = NotificationDto.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .message(message)
                .eventType(eventType)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            notificationClient.sendNotification(notification, notificationCategory);
        } catch (FeignException e) {
            log.error("Failed to send notification: {}", e.getMessage());
            throw new NotificationSendingException("Failed to send notification.");
        }
    }
}