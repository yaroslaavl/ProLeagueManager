package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.TournamentStage;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.TournamentStageRepository;
import org.league.app.exception.IncorrectTournamentStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TournamentStageService {

    private final TournamentStageRepository tournamentStageRepository;
    private final CompetitionRepository competitionRepository;

    @Transactional
    public void generateTournamentStages(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new IllegalArgumentException("Competition not found"));

        if (!competition.getStatus().equals(CompetitionStatus.ACTIVE)) {
            throw new IncorrectTournamentStatus("Competition is not active");
        }

        Integer maxTeamSize = competition.getGameSystem().getMaxTeamSize();
        int counter = 1;
        for (int i = maxTeamSize / 2; i >= 1; i = i / 2) {
            String tempStage = "";
            if (i == 1) {
                tempStage = "FINAL";
            } else if (i == 2) {
                tempStage = "SEMI FINAL";
            } else {
                tempStage = "1/" + i;
            }
            String rules = competition.getGameSystem().getRules();
            boolean isElimination = rules.startsWith("Single Elimination");
            TournamentStage tournamentStage = TournamentStage.builder()
                    .competition(competition)
                    .stageName(tempStage)
                    .stageOrder(counter)
                    .isElimination(isElimination)
                    .build();

            tournamentStageRepository.saveAndFlush(tournamentStage);
            counter++;
        }
    }
}
