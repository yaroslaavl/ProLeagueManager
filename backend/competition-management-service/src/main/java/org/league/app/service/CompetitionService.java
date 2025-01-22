package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.CompetitionParticipant;
import org.league.app.database.entity.GameSystem;
import org.league.app.database.entity.enums.CompetitionParticipantStatus;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;
import org.league.app.database.repository.CompetitionParticipantRepository;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.GameSystemRepository;
import org.league.app.database.specification.CompetitionSpecification;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.exception.CaptainNotIncludedException;
import org.league.app.exception.CompetitionAlreadyExists;
import org.league.app.exception.CompetitionNotFoundException;
import org.league.app.exception.GameSystemNotFoundException;
import org.league.app.feign.authClient.AuthClientFeign;
import org.league.app.feign.authClient.UserDto;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.league.app.feign.teamClient.TeamClientFeign;
import org.league.app.feign.teamClient.TeamFeignDto;
import org.league.app.feign.teamClient.TeamMemberFeignDto;
import org.league.app.mapper.CompetitionMapper;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final CompetitionParticipantRepository competitionParticipantRepository;
    private final GameSystemRepository gameSystemRepository;
    private final CompetitionMapper competitionMapper;
    private final SportClientFeign sportClientFeign;
    private final AuthClientFeign authClientFeign;
    private final TeamClientFeign teamClientFeign;

    @Transactional
    public CompetitionReadDto createCompetition(CompetitionCreateEditDto competitionCreate,
                                                Integer gameSystemId,
                                                Integer sportId) {
        if (competitionRepository.findCompetitionByName(competitionCreate.getName()).isPresent()) {
            throw new CompetitionAlreadyExists("Competition with current name already exists");
        }

        if (competitionCreate.getStartDate().isAfter(competitionCreate.getEndDate())) {
            throw new IllegalArgumentException("Start date cannot be after end date");
        }

        CompetitionStatus competitionStatus;
        if (competitionCreate.getCompetitionType().toUpperCase().equals(CompetitionType.LEAGUE.toString())) {
            competitionStatus = CompetitionStatus.valueOf(null);
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

    @Transactional
    public CompetitionReadDto edit(String competitionName, CompetitionCreateEditDto newCompetition) {
        Competition currentCompetition = competitionRepository.findCompetitionByName(competitionName)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found : " + competitionName));

        if (competitionRepository.findCompetitionByName(newCompetition.getName()).isPresent()) {
            throw new CompetitionAlreadyExists("Competition with name:" + newCompetition.getName() + " already exists");
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
    public boolean addTeamToCompetition(UUID competitionId, UUID teamId, List<Long> selectedPlayerIds) { 
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        if (competition.getGameSystem().getIsIndividual()) {
            CompetitionParticipant competitionParticipant = CompetitionParticipant.builder()
                    .competition(competition)
                    .teamId(null)
                    .playerId(userByEmail.getId())
                    .isTeam(false)
                    .registeredAt(LocalDateTime.now())
                    .competitionParticipantStatus(CompetitionParticipantStatus.REGISTERED)
                    .build();

            competitionParticipantRepository.save(competitionParticipant);
            return true;
        } else {
            List<TeamMemberFeignDto> teamMembers = competitionRepository.findTeamById(teamId);
            boolean captainExists = teamMembers.stream()
                    .filter(member -> member.getRoles().stream()
                            .anyMatch(role -> role.getRoleName().equalsIgnoreCase("CAPTAIN")))
                    .anyMatch(member -> selectedPlayerIds.contains(member.getId()));

            if (!captainExists) {
                throw new CaptainNotIncludedException("Selected players must include the team captain.");
            }

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

            competitionParticipantRepository.saveAll(participants);
            return true;
        }
    }

    private String securityContext() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

}
