package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.GameSystemRepository;
import org.league.app.database.specification.CompetitionSpecification;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.exception.CompetitionAlreadyExists;
import org.league.app.exception.CompetitionNotFoundException;
import org.league.app.exception.GameSystemNotFoundException;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.league.app.mapper.CompetitionMapper;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final GameSystemRepository gameSystemRepository;
    private final CompetitionMapper competitionMapper;
    private final SportClientFeign sportClientFeign;

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

        Optional.ofNullable(newCompetition.getName()).ifPresent(currentCompetition::setName);
        Optional.ofNullable(newCompetition.getSportId()).ifPresent(currentCompetition::setSportId);
        Optional.ofNullable(newCompetition.getCompetitionType()).map(CompetitionType::valueOf).ifPresent(currentCompetition::setCompetitionType);
        Optional.ofNullable(newCompetition.getStartDate()).ifPresent(currentCompetition::setStartDate);
        Optional.ofNullable(newCompetition.getEndDate()).ifPresent(currentCompetition::setEndDate);

        competitionRepository.save(currentCompetition);
        return competitionMapper.toDto(currentCompetition);
    }

    @Transactional
    public boolean delete(String competitionName) {
        return competitionRepository.findCompetitionByName(competitionName)
                .map(entity -> {
                    int deleted = competitionRepository.deleteCompetitionByName(competitionName.trim());
                    competitionRepository.flush();
                    return deleted > 0;
                })
                .orElse(false);
    }

}
