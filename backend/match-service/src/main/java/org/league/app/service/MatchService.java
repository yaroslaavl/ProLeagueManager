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
import org.league.app.dto.MatchCreateEditDto;
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
import java.time.temporal.ChronoUnit;
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
    private List<UUID> activeCompetitionCache = new ArrayList<>();
    private List<UUID> activeLastDayLeaguesCache = new ArrayList<>();

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
    public void updateActiveTournamentsAndLeaguesCache() {
        activeCompetitionCache = competitionClient.getActiveCompetitions();
        log.info("Updated active tournaments cache: {}", activeCompetitionCache.size());
        activeLastDayLeaguesCache = competitionClient.getActiveLeagues();
        log.info("Updated active leagues cache: {}", activeLastDayLeaguesCache.size());
    }

    @Scheduled(fixedDelay = 30000)
    public void processScheduledTournamentMatches() {
        if (activeCompetitionCache.isEmpty()) {
            return;
        }

        List<Match> matchesByMatchStatus = matchRepository.findScheduledMatchesByActiveCompetitions(activeCompetitionCache);
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
        if (activeCompetitionCache.isEmpty()) {
            return;
        }

        List<Match> matchesByMatchStatus = matchRepository.findInProgressMatchesByActiveTournamentId(activeCompetitionCache);
        log.info("Checking match winners at {}", LocalDateTime.now());

        for (Match match : matchesByMatchStatus) {
            if (match.getWinnerPlayerId() != null || match.getWinnerTeamId() != null) {
                processNextMatch(match);
            }
        }
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

        if (competitionClient.findById(match.getCompetitionId()).getCompetitionType().equals("TOURNAMENT")) {
            processNextMatch(matchById);
        }
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

            Set<Long> allTeamPlayersIds =
                    competitionClient.findCompetitionParticipantsById(match.getCompetitionId(), teamById.getId());

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

    @Transactional
    public void generateLeagueMatches(LeagueBracketDto bracketDto) {
        CompetitionDto competition = bracketDto.getCompetition();
        List<LeagueStandingDto> leagueStandings = new ArrayList<>(bracketDto.getLeagueStanding());

        if (leagueStandings.size() % 2 != 0) {
            leagueStandings.add(null);
        }

        int teamNums = leagueStandings.size();
        int totalRounds = teamNums - 1;
        int halfSize = teamNums / 2;
        int totalMatches = halfSize * totalRounds;

        LocalDateTime startDate = competition.getStartDate();
        LocalDateTime endDate = competition.getEndDate();
        long totalDays = ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate()) + 1;

        if (totalDays < totalMatches) {
            throw new IllegalStateException("Not enough days to generate league matches");
        }

        double interval = (totalDays - 1) / (double) (totalMatches - 1);

        List<LeagueStandingDto> temp = new ArrayList<>(leagueStandings);
        LeagueStandingDto firstTeam = temp.removeFirst();

        int matchCounter = 0;

        for (int round = 0; round < totalRounds; round++) {
            LocalDateTime matchDay = startDate.plusDays(Math.round(matchCounter * interval));
            createAndSaveMatch(competition, firstTeam, temp.getLast(), matchDay, round + 1);
            matchCounter++;

            for (int i = 0; i < halfSize - 1; i++) {
                matchDay = startDate.plusDays(Math.round(matchCounter * interval));
                if (startDate.getHour() > 11 && i > halfSize / 2) {
                    matchDay = matchDay.plusHours(4);
                }
                LeagueStandingDto d1 = temp.get(i);
                LeagueStandingDto d2 = temp.get(temp.size() - 2 - i);
                if (round == totalRounds - 1 && matchDay == endDate) {
                    matchDay = matchDay.minusHours(5);
                }
                createAndSaveMatch(competition, d1, d2, matchDay, round + 1);
                matchCounter++;
            }

            LeagueStandingDto last = temp.removeLast();
            temp.addFirst(last);
        }
    }

    @Transactional
    public void editMatchScore(UUID matchId, MatchCreateEditDto matchCreateEditDto) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new MatchNotFoundException("Match not found"));


        CompetitionDto competition = competitionClient.findById(match.getCompetitionId());

        if (competition.getCompetitionType().equalsIgnoreCase("LEAGUE") &&
                match.getMatchStatus().equals(MatchStatus.IN_PROGRESS)) {
            Optional.ofNullable(matchCreateEditDto.getScoreA()).ifPresent(match::setScoreA);
            Optional.ofNullable(matchCreateEditDto.getScoreB()).ifPresent(match::setScoreB);
            Optional.ofNullable(matchCreateEditDto.getIsOvertime()).ifPresent(match::setIsOvertime);

            boolean isNotTeam = match.getTeamAId() == null && match.getTeamBId() == null;
            boolean isWinnerA = match.getScoreA() > match.getScoreB();

            List<Long> playerIds = new ArrayList<>();
            List<UUID> teamIds = new ArrayList<>();

            if (isNotTeam) {
                playerIds.add(match.getPlayerAId());
                playerIds.add(match.getPlayerBId());
            } else {
                teamIds.add(match.getTeamAId());
                teamIds.add(match.getTeamBId());
            }

            List<LeagueStandingDto> leagueStandingDtos = competitionClient.getLeagueStanding(competition.getId(), teamIds, playerIds);

            if (match.getScoreA().equals(match.getScoreB())) {
                match.setIsDraw(true);
                match.setMatchStatus(MatchStatus.FINISHED);
                matchRepository.save(match);
                updateLeagueStandings(leagueStandingDtos, isNotTeam, isWinnerA, match.getIsDraw(), match.getPlayerAId(), match.getPlayerBId(), match.getTeamAId(), match.getTeamBId());
                return;
            }

            if (isNotTeam) {
                match.setWinnerPlayerId(isWinnerA ? match.getPlayerAId() : match.getPlayerBId());
            } else {
                match.setWinnerTeamId(isWinnerA ? match.getTeamAId() : match.getTeamBId());
            }

            match.setMatchStatus(MatchStatus.FINISHED);
            matchRepository.save(match);

            updateLeagueStandings(leagueStandingDtos, isNotTeam, isWinnerA, match.getIsDraw(), match.getPlayerAId(), match.getPlayerBId(), match.getTeamAId(), match.getTeamBId());
        }
    }

    @Scheduled(fixedRate = 60000)
    public void checkLeagueEnding() {
        if (activeLastDayLeaguesCache.isEmpty()) {
            return;
        }

        for (UUID competitionId : activeLastDayLeaguesCache) {
            Match lastMatch = matchRepository.findLastMatchByCompetitionId(competitionId);
            if (lastMatch.getMatchStatus().equals(MatchStatus.FINISHED) && (lastMatch.getWinnerPlayerId() != null || lastMatch.getWinnerTeamId() != null)) {
                boolean isFinalized = matchPublisher.publishFinalizedCompetition(competitionId.toString());
                if (!isFinalized) {
                    log.error("Finalization of competition failed!");
                    throw new FinalizeCompetitionException("Failed to finalize competition with id: " + competitionId);
                }
                if (matchRepository.findMaxPointsMatchByCompetitionId(competitionId).getWinnerPlayerId() != null) {
                    sendNotificationMessage(matchRepository.findMaxPointsMatchByCompetitionId(competitionId).getWinnerPlayerId(),
                            "Congratulations! You won the " + competitionClient.findById(competitionId).getName(),
                            "COMPETITION_WINNER",
                            competitionClient.findById(competitionId).getCompetitionType());
                } else {
                    TeamFeignDto team = teamClient.findTeamById(matchRepository.findMaxPointsMatchByCompetitionId(competitionId).getWinnerTeamId());

                    Set<Long> winnersIds = team.getTeamMembers().stream()
                            .map(TeamMemberFeignDto::getUserId)
                            .collect(Collectors.toSet());

                    for (Long playerId : winnersIds) {
                        sendNotificationMessage(playerId,
                                "Congratulations! Your team won the competition " + competitionClient.findById(competitionId).getName(),
                                "COMPETITION_WINNER",
                                competitionClient.findById(competitionId).getCompetitionType());
                    }
                }
            }
        }
    }

    private void updateLeagueStandings(List<LeagueStandingDto> leagueStandings, boolean isNotTeam, boolean isWinnerA, boolean isDraw,
                                       Long playerAId, Long playerBId, UUID teamAId, UUID teamBId) {
        if (isDraw) {
            for (LeagueStandingDto leagueStanding : leagueStandings) {
                leagueStanding.setDraws(leagueStanding.getDraws() + 1);
                leagueStanding.setPoints(leagueStanding.getPoints() + 1);
            }
            competitionClient.updateLeagueStanding(leagueStandings);
            return;
        }

        if (isNotTeam) {
            for (LeagueStandingDto leagueStanding : leagueStandings) {
                if (leagueStanding.getPlayerId().equals(playerAId)) {
                    if (isWinnerA) {
                        leagueStanding.setWins(leagueStanding.getWins() + 1);
                        leagueStanding.setPoints(leagueStanding.getPoints() + 3);
                    } else {
                        leagueStanding.setLosses(leagueStanding.getLosses() + 1);
                    }
                } else if (leagueStanding.getPlayerId().equals(playerBId)) {
                    if (!isWinnerA) {
                        leagueStanding.setWins(leagueStanding.getWins() + 1);
                        leagueStanding.setPoints(leagueStanding.getPoints() + 3);
                    } else {
                        leagueStanding.setLosses(leagueStanding.getLosses() + 1);
                    }
                }
            }
        } else {
            for (LeagueStandingDto leagueStanding : leagueStandings) {
                if (leagueStanding.getTeamId().equals(teamAId)) {
                    if (isWinnerA) {
                        leagueStanding.setWins(leagueStanding.getWins() + 1);
                        leagueStanding.setPoints(leagueStanding.getPoints() + 3);
                    } else {
                        leagueStanding.setLosses(leagueStanding.getLosses() + 1);
                    }
                } else if (leagueStanding.getTeamId().equals(teamBId)) {
                    if (!isWinnerA) {
                        leagueStanding.setWins(leagueStanding.getWins() + 1);
                        leagueStanding.setPoints(leagueStanding.getPoints() + 3);
                    } else {
                        leagueStanding.setLosses(leagueStanding.getLosses() + 1);
                    }
                }
            }
        }

        competitionClient.updateLeagueStanding(leagueStandings);
    }

    private void createAndSaveMatch(CompetitionDto competition, LeagueStandingDto dtoA, LeagueStandingDto dtoB, LocalDateTime matchDate, int round) {
        if (dtoA == null || dtoB == null) {
            return;
        }

        UUID competitionId = competition.getId();
        if (dtoA.getTeamId() == null) {
            Match match = Match.builder()
                    .competitionId(competitionId)
                    .playerAId(dtoA.getPlayerId())
                    .playerBId(dtoB.getPlayerId())
                    .matchDate(matchDate)
                    .leagueTourNumber(round)
                    .scoreA(0)
                    .scoreB(0)
                    .build();
            matchRepository.save(match);
        } else {
            Match match = Match.builder()
                    .competitionId(competitionId)
                    .teamAId(dtoA.getTeamId())
                    .teamBId(dtoB.getTeamId())
                    .matchDate(matchDate)
                    .leagueTourNumber(round)
                    .scoreA(0)
                    .scoreB(0)
                    .build();
            matchRepository.save(match);
        }
    }

    @Transactional
    public void processNextMatch(Match match) {
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