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
import org.league.app.exception.GameSystemNotFoundException;
import org.league.app.mapper.CompetitionMapper;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompetitionService {

    private final CompetitionRepository competitionRepository;
    private final GameSystemRepository gameSystemRepository;
    private final CompetitionMapper competitionMapper;

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

        Competition competition = Competition.builder()
                .name(competitionCreate.getName())
                .sportId(sportId)
                .gameSystem(gameSystemRepository.findById(gameSystemId)
                        .orElseThrow(() -> new GameSystemNotFoundException("Game System not found")))
                .competitionType(CompetitionType.valueOf(competitionCreate.getCompetitionType().toUpperCase()))
                .status(CompetitionStatus.UPCOMING)
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
    public List<Competition> findAllTournamentsByFiltersAndDynamicSearch(String keyword, Boolean isIndividual, String status) {
        if (keyword == null && isIndividual == null && status == null) {
            return competitionRepository.findAll();
        }

        Specification<Competition> specification = Specification
                .where(CompetitionSpecification.hasCompetitionStatus(status))
                .and(CompetitionSpecification.search(keyword))
                .and(CompetitionSpecification.isCompetitionIndividual(isIndividual))
                .and(CompetitionSpecification.isTournament(CompetitionType.TOURNAMENT));

        return competitionRepository.findAll(specification);
    }
}
