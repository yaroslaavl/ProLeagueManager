package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.enums.CompetitionType;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.GameSystemRepository;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.exception.CompetitionAlreadyExists;
import org.league.app.exception.CompetitionNotFoundException;
import org.league.app.exception.GameSystemNotFoundException;
import org.league.app.mapper.CompetitionMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class    CompetitionService {

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
