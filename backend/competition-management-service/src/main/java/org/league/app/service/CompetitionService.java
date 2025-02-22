package org.league.app.service;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.broker.LeagueBracketDto;
import org.league.app.broker.LeagueEventPublisher;
import org.league.app.database.entity.*;
import org.league.app.database.entity.enums.CompetitionParticipantStatus;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;
import org.league.app.database.repository.CompetitionParticipantRepository;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.GameSystemRepository;
import org.league.app.database.repository.LeagueStandingRepository;
import org.league.app.database.specification.CompetitionSpecification;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.dto.LeagueStandingReadDto;
import org.league.app.exception.*;
import org.league.app.feign.authClient.AuthClientFeign;
import org.league.app.feign.authClient.UserDto;
import org.league.app.feign.notificationClient.NotificationClientFeign;
import org.league.app.feign.notificationClient.NotificationDto;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.league.app.feign.teamClient.TeamClientFeign;
import org.league.app.feign.teamClient.TeamFeignDto;
import org.league.app.feign.teamClient.TeamMemberFeignDto;
import org.league.app.mapper.CompetitionMapper;
import org.league.app.mapper.LeagueStandingMapper;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository competitionParticipantRepository;
    private final GameSystemRepository gameSystemRepository;
    private final NotificationClientFeign notificationClientFeign;
    private final CompetitionMapper competitionMapper;
    private final SportClientFeign sportClientFeign;
    private final AuthClientFeign authClientFeign;
    private final TeamClientFeign teamClientFeign;
    private final LeagueStandingRepository leagueStandingRepository;
    private final LeagueEventPublisher leagueEventPublisher;
    private final LeagueStandingMapper leagueStandingMapper;

    @Transactional
    public CompetitionReadDto createCompetition(CompetitionCreateEditDto competitionCreate,
                                                Integer gameSystemId,
                                                Integer sportId) {
        if (competitionRepository.findCompetitionByName(competitionCreate.getName()).isPresent()) {
            throw new CompetitionAlreadyExistsException("Competition with current name already exists");
        }

        if (competitionCreate.getStartDate().isAfter(competitionCreate.getEndDate())) {
            throw new TimeErrorException("Start date cannot be after end date");
        }

        CompetitionStatus competitionStatus;
        if (competitionCreate.getCompetitionType().toUpperCase().equals(CompetitionType.LEAGUE.toString())) {
            competitionStatus = CompetitionStatus.NONE;
        } else {
            competitionStatus = CompetitionStatus.UPCOMING;
        }

        Competition competition = Competition.builder()
                .name(competitionCreate.getName())
                .sportId(sportId)
                .gameSystem(gameSystemRepository.findById(gameSystemId)
                        .orElseThrow(() -> new GameSystemNotFoundException("Game System not found")))
                .competitionType(CompetitionType.valueOf(competitionCreate.getCompetitionType().toUpperCase()))
                .status(competitionStatus)
                .startDate(competitionCreate.getStartDate())
                .endDate(competitionCreate.getEndDate())
                .createdAt(LocalDateTime.now())
                .build();

        competitionRepository.save(competition);
        return competitionMapper.toDto(competition);
    }

    @Transactional
    public CompetitionReadDto edit(String competitionName, CompetitionCreateEditDto newCompetition) {
        Competition currentCompetition = competitionRepository.findCompetitionByName(competitionName)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found : " + competitionName));

        if (competitionRepository.findCompetitionByName(newCompetition.getName()).isPresent()) {
            throw new CompetitionAlreadyExistsException("Competition with name:" + newCompetition.getName() + " already exists");
        }

        GameSystem gameSystem = gameSystemRepository.findById(newCompetition.getGameSystemId())
                .orElseThrow(() -> new GameSystemNotFoundException("Game System not found"));

        Optional.ofNullable(newCompetition.getName()).ifPresent(currentCompetition::setName);
        Optional.ofNullable(newCompetition.getSportId()).ifPresent(currentCompetition::setSportId);
        Optional.ofNullable(newCompetition.getGameSystemId()).ifPresent(gameSystem::setId);
        Optional.ofNullable(newCompetition.getCompetitionType()).map(CompetitionType::valueOf).ifPresent(currentCompetition::setCompetitionType);
        Optional.ofNullable(newCompetition.getStartDate()).ifPresent(currentCompetition::setStartDate);
        Optional.ofNullable(newCompetition.getEndDate()).ifPresent(currentCompetition::setEndDate);
        Optional.ofNullable(newCompetition.getStatus()).map(CompetitionStatus::valueOf).ifPresent(currentCompetition::setStatus);

        competitionRepository.save(currentCompetition);
        return competitionMapper.toDto(currentCompetition);
    }

    @Transactional
    public boolean delete(String competitionName) {
        return competitionRepository.findCompetitionByName(competitionName)
                .map(entity -> {
                    int deleted = competitionRepository.deleteCompetitionByName(competitionName);
                    competitionRepository.flush();
                    return deleted > 0;
                })
                .orElse(false);
    }

    @Transactional
    public boolean participation(UUID competitionId, UUID teamId, List<Long> selectedPlayerIds) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        if (competition.getGameSystem().getIsIndividual()) {
            UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());
            if (competitionParticipantRepository.findCompetitionParticipantByPlayerIdAndCompetitionId(userByEmail.getId(), competitionId).isPresent()) {
                throw new UserAlreadyParticipating("User is already participating");
            }

            CompetitionParticipant competitionParticipant = CompetitionParticipant.builder()
                    .competition(competition)
                    .teamId(null)
                    .playerId(userByEmail.getId())
                    .isTeam(false)
                    .registeredAt(LocalDateTime.now())
                    .competitionParticipantStatus(CompetitionParticipantStatus.REGISTERED)
                    .build();

            if (competition.getCompetitionType().equals(CompetitionType.LEAGUE)) {
                LeagueStanding leagueStanding = LeagueStanding.builder()
                        .competition(competition)
                        .teamId(null)
                        .playerId(userByEmail.getId())
                        .wins(0)
                        .draws(0)
                        .losses(0)
                        .points(0)
                        .build();

                leagueStandingRepository.save(leagueStanding);
            }

            competitionParticipantRepository.save(competitionParticipant);
            sendNotificationMessage(userByEmail.getId(), "You've joined a " + competition.getCompetitionType() + " called " + competition.getName(), "SOLO_PARTICIPATION", competition.getCompetitionType().toString());
            return true;
        } else {
            TeamFeignDto teamById = teamClientFeign.findTeamById(teamId);
            if (competitionParticipantRepository.findCompetitionParticipantByTeamIdAndCompetitionId(teamById.getId(), competitionId).isPresent()) {
                throw new TeamAlreadyParticipating("Team is already participating");
            }
            log.info("Team data: '{}'", teamById);

            boolean captainExists = teamById.getTeamMembers().stream()
                    .filter(member -> member.getRoles().stream()
                            .anyMatch(role -> role.getRoleName().equalsIgnoreCase("CAPITAN")))
                    .anyMatch(member -> selectedPlayerIds.contains(member.getUserId()));

            if (!captainExists) {
                throw new CaptainNotIncludedException("Selected players must include the team captain.");
            }

            if (gameSystemRepository.countMaxPlayersPerTeamAtCompetition(competition.getGameSystem().getId()) >= selectedPlayerIds.size()
                    && selectedPlayerIds.size() >= gameSystemRepository.countMinPlayersPerTeamAtCompetition(competition.getGameSystem().getId())) {
                List<CompetitionParticipant> participants = selectedPlayerIds.stream()
                        .map(playerId -> CompetitionParticipant.builder()
                                .competition(competition)
                                .teamId(teamId)
                                .playerId(playerId)
                                .isTeam(true)
                                .registeredAt(LocalDateTime.now())
                                .competitionParticipantStatus(CompetitionParticipantStatus.REGISTERED)
                                .build())
                        .toList();

                if (competition.getCompetitionType().equals(CompetitionType.LEAGUE)) {
                    LeagueStanding leagueStanding = LeagueStanding.builder()
                            .competition(competition)
                            .teamId(teamId)
                            .playerId(null)
                            .build();

                    leagueStandingRepository.save(leagueStanding);
                }

                competitionParticipantRepository.saveAll(participants);
                TeamMemberFeignDto manager = teamById.getTeamMembers().stream()
                        .filter(dto -> dto.getRoles().stream()
                                .anyMatch(role -> role.getRoleName().equalsIgnoreCase("MANAGER")))
                        .findFirst()
                        .orElseThrow(() -> new ManagerNotFound("Manager not found"));

                for (CompetitionParticipant participant : participants) {
                    String message = participant.getPlayerId().equals(manager.getUserId())
                            ? "You've registered your team " + teamById.getTeamName()
                            : "You were registered in the " + competition.getCompetitionType() + " as part of " + teamById.getTeamName();

                    sendNotificationMessage(participant.getPlayerId(), message, "TEAM_PARTICIPATION", competition.getCompetitionType().toString());
                }
                return true;
            } else {
                throw new PlayerSizeNotMatchException("Player size not match.");
            }
        }
    }

    @Transactional
    public void closeLeagueRegistration(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        if (checkLeagueCapacity(competitionId)) {
            competition.setStatus(CompetitionStatus.CANCELLED);
        } else {
            competition.setStatus(CompetitionStatus.ACTIVE);
        }

        competitionRepository.saveAndFlush(competition);

        if (competition.getStatus().equals(CompetitionStatus.ACTIVE)) {
            CompetitionReadDto competitionReadDto = competitionMapper.toDto(competition);

            List<LeagueStandingReadDto> leagueStandings = leagueStandingRepository.findAllByCompetitionId(competitionId).stream().map(leagueStandingMapper::toDto).toList();

            leagueEventPublisher.publishLeagueStartEvent(new LeagueBracketDto(competitionReadDto, leagueStandings));
        }
    }

    @Transactional
    public void updateLeagueStanding(List<LeagueStandingReadDto> leagueStandingReadDto) {
        for (LeagueStandingReadDto dto : leagueStandingReadDto) {
            LeagueStanding league = leagueStandingRepository.findLeagueStandingByCompetitionIdWhereTeamIdOrPlayerId(
                    dto.getCompetitionId(), dto.getTeamId(), dto.getPlayerId());

            league.setWins(dto.getWins());
            league.setDraws(dto.getDraws());
            league.setLosses(dto.getLosses());
            league.setPoints(dto.getPoints());

            leagueStandingRepository.save(league);
        }
    }

    @Transactional
    public void finalizeCompetition(String competitionId) {
        Competition competition = competitionRepository.findById(UUID.fromString(competitionId))
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        competition.setEndDate(LocalDateTime.now());
        competition.setStatus(CompetitionStatus.COMPLETED);

        log.info("Competition {} finalized successfully.", competition.getName());
        competitionRepository.save(competition);

        if (competition.getCompetitionType().equals(CompetitionType.LEAGUE)) {
            List<LeagueStanding> leagueStandings = leagueStandingRepository.findLeagueStandingsMaxPointsByCompetitionId(competition.getId());

            if (leagueStandings.size() == 1) {
                declareWinner(competition, leagueStandings.getFirst());
            } else if (leagueStandings.size() > 1) {
                Optional<LeagueStanding> winnerByWins = leagueStandings.stream()
                        .max(Comparator.comparing(LeagueStanding::getWins));

                List<LeagueStanding> tiedByWins = leagueStandings.stream()
                        .filter(ls -> ls.getWins().equals(winnerByWins.get().getWins()))
                        .toList();

                if (tiedByWins.size() == 1) {
                    declareWinner(competition, tiedByWins.getFirst());
                    return;
                }

                Optional<LeagueStanding> winnerByDraws = tiedByWins.stream()
                        .min(Comparator.comparing(LeagueStanding::getDraws));

                List<LeagueStanding> tiedByDraws = tiedByWins.stream()
                        .filter(ls -> ls.getDraws().equals(winnerByDraws.get().getDraws()))
                        .toList();

                if (tiedByDraws.size() == 1) {
                    declareWinner(competition, tiedByDraws.getFirst());
                    return;
                }

                LeagueStanding randomWinner = tiedByDraws.get(new Random().nextInt(tiedByDraws.size()));
                declareWinner(competition, randomWinner);
            }
        }
    }

    /**
     * Method for searching tournaments by filters and with dynamic search by keyword ‘name’
     *
     * @param keyword
     * @param isIndividual
     * @param status
     * @return the list of tournaments
     */
    public List<CompetitionReadDto> findAllTournamentsByFiltersAndDynamicSearch(String keyword, Boolean isIndividual, String status, Boolean isEsport) {
        List<Integer> allByIsEsport = sportClientFeign.findAllByIsEsport(isEsport).stream()
                .map(SportDto::getId)
                .toList();

        Specification<Competition> specification = Specification
                .where(CompetitionSpecification.isEsport(allByIsEsport))
                .and(CompetitionSpecification.search(keyword))
                .and(CompetitionSpecification.isCompetitionIndividual(isIndividual))
                .and(CompetitionSpecification.hasCompetitionStatus(status))
                .and(CompetitionSpecification.hasCompetitionType(CompetitionType.TOURNAMENT));

        return competitionRepository.findAll(specification).stream()
                .map(competitionMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<CompetitionReadDto> findAllLeaguesByFilters(Boolean isIndividual, Boolean isEsport) {
        List<Integer> allByIsEsport = sportClientFeign.findAllByIsEsport(isEsport).stream()
                .map(SportDto::getId)
                .toList();

        Specification<Competition> specification = Specification
                .where(CompetitionSpecification.isCompetitionIndividual(isIndividual))
                .and(CompetitionSpecification.isEsport(allByIsEsport))
                .and(CompetitionSpecification.hasCompetitionType(CompetitionType.LEAGUE));

        return competitionRepository.findAll(specification).stream()
                .map(competitionMapper::toDto)
                .collect(Collectors.toList());
    }

    public List<CompetitionReadDto> findAll() {
        return competitionRepository.findAll().stream()
                .map(competitionMapper::toDto)
                .collect(Collectors.toList());
    }

    public CompetitionReadDto findById(UUID id) {
        Competition competition = competitionRepository.findById(id)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        return competitionMapper.toDto(competition);
    }

    public List<CompetitionReadDto> getActiveCompetitionIds() {
        return competitionRepository.getActiveCompetitions().stream()
                .map(competitionMapper::toDto)
                .toList();
    }

    public List<UUID> getLastDayActiveLeagues() {
        return competitionRepository.getLastDayActiveLeagues();
    }

    public Integer countCurrentPlayersPerCompetition(UUID competitionId) {
        return competitionParticipantRepository.countTeamsOrUsersByCompetitionId(competitionId);
    }

    public Set<Long> findCompetitionParticipantsByCompetitionIdAndTeamId(UUID competitionId, UUID teamId) {
        return competitionParticipantRepository.findParticipantsByCompetitionIdAndTeamId(competitionId, teamId);
    }

    public List<LeagueStandingReadDto> getLeagueStandingByCompetitionIdAndTeamIdOrPlayerId(UUID competitionId, List<UUID> teamIds, List<Long> playerIds) {
        return leagueStandingRepository.findLeagueStandingsByCompetitionIdWherePlayerIdOrTeamId(competitionId, teamIds, playerIds).stream().map(leagueStandingMapper::toDto).toList();
    }

    private void declareWinner(Competition competition, LeagueStanding winner) {
        if (winner.getTeamId() == null) {
            sendNotificationMessage(
                    winner.getPlayerId(),
                    "Congratulations! You won the " + competition.getName(),
                    "COMPETITION_WINNER",
                    competition.getCompetitionType().toString()
            );
        } else {
            TeamFeignDto team = teamClientFeign.findTeamById(winner.getTeamId());
            team.getTeamMembers().stream()
                    .map(TeamMemberFeignDto::getUserId)
                    .forEach(playerId -> sendNotificationMessage(
                            playerId,
                            "Congratulations! Your team won the competition " + competition.getName(),
                            "COMPETITION_WINNER",
                            competition.getCompetitionType().toString()
                    ));
        }
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
            notificationClientFeign.sendNotification(notification, notificationCategory);
        } catch (FeignException e) {
            log.error("Failed to send notification: {}", e.getMessage());
            throw new NotificationSendingException("Failed to send notification.");
        }
    }

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto userDto) {
            return userDto.getEmail();
        }
        return authentication.getName();
    }

    private boolean checkLeagueCapacity(UUID competitionId) {
        Competition competitionWithGameSystem = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        return competitionWithGameSystem.getGameSystem().getMinTeamSize() >
                competitionParticipantRepository.countTeamsOrUsersByCompetitionId(competitionId)
                && LocalDateTime.now().isAfter(competitionWithGameSystem.getStartDate().minusHours(1));
    }
}
