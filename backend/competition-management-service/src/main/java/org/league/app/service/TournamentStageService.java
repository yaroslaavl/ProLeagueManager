package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.TournamentStage;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;
import org.league.app.database.repository.CompetitionParticipantRepository;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.TournamentStageRepository;
import org.league.app.exception.CompetitionNotFoundException;
import org.league.app.exception.IncorrectTournamentStatus;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentStageService {

    private final CompetitionParticipantRepository competitionParticipantRepository;
    private final TournamentStageRepository tournamentStageRepository;
    private final CompetitionRepository competitionRepository;
    private final SportClientFeign sportClientFeign;

    @Transactional
    public void closeTournamentRegistrationAndGenerateTournamentStages(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        if (checkTournamentCapacity(competitionId)) {
            competition.setStatus(CompetitionStatus.CANCELLED);
        } else {
            competition.setStatus(CompetitionStatus.ACTIVE);
        }

        competitionRepository.saveAndFlush(competition);

        if (competition.getStatus().equals(CompetitionStatus.ACTIVE)) {
            generateTournamentStages(competitionId);
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void autoStartTournaments() {
        log.info("Checking tournaments at {}", LocalDateTime.now());

        List<Competition> competitions = competitionRepository.findAllByStatusAndCompetitionType(CompetitionStatus.UPCOMING, CompetitionType.TOURNAMENT);

        for (Competition competition : competitions) {
            SportDto sportDto = sportClientFeign.findSportById(competition.getSportId());
            try {
                if (sportDto.getIsEsport()) {
                    if (LocalDateTime.now().isAfter(competition.getStartDate().minusHours(1))) {
                        log.info("Auto-starting e-sport tournament: '{}'", competition.getName());
                        closeTournamentRegistrationAndGenerateTournamentStages(competition.getId());
                    }
                } else {
                    if (LocalDateTime.now().isAfter(competition.getStartDate().minusHours(24))) {
                        log.info("Auto-starting sport tournament: '{}'", competition.getName());
                        closeTournamentRegistrationAndGenerateTournamentStages(competition.getId());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to start tournament '{}': {}", competition.getName(), e.getMessage(), e);
            }
        }
    }

    private void generateTournamentStages(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        if (!competition.getStatus().equals(CompetitionStatus.ACTIVE)) {
            throw new IncorrectTournamentStatus("Competition is not active");
        }

        if (tournamentStageRepository.findTournamentStagesByCompetition(competition).isPresent()) {
            log.error("Tournament stages already exist in competition '{}'", competition.getName());
            return;
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

    private boolean checkTournamentCapacity(UUID competitionId) {
        Competition competitionWithGameSystem = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        return competitionWithGameSystem.getGameSystem().getMinTeamSize() >
                competitionParticipantRepository.countTeamsOrUsersByCompetitionId(competitionId);
    }
}
