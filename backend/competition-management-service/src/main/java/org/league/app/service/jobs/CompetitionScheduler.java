package org.league.app.service.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.league.app.service.CompetitionService;
import org.league.app.service.TournamentStageService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class CompetitionScheduler {

    private final SportClientFeign sportClient;
    private final CompetitionService competitionService;
    private final CompetitionRepository competitionRepository;
    private final TournamentStageService tournamentStageService;

    @Scheduled(fixedDelay = 60000)
    public void autoStartLeague() {
        log.info("Checking leagues at {}", LocalDateTime.now());

        List<Competition> competitions = competitionRepository.findAllByStatusAndCompetitionType(CompetitionStatus.NONE, CompetitionType.LEAGUE);

        for (Competition competition : competitions) {
            try {
                if (LocalDateTime.now().isAfter(competition.getStartDate().minusDays(1))) {
                    log.info("Auto-starting league: '{}'", competition.getName());
                    competitionService.closeLeagueRegistration(competition.getId());
                }
            } catch (Exception e) {
                log.error("Failed to start league '{}': {}", competition.getName(), e.getMessage(), e);
            }
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void autoStartTournaments() {
        log.info("Checking tournaments at {}", LocalDateTime.now());

        List<Competition> competitions = competitionRepository.findAllByStatusAndCompetitionType(CompetitionStatus.UPCOMING, CompetitionType.TOURNAMENT);

        for (Competition competition : competitions) {
            SportDto sportDto = sportClient.findSportById(competition.getSportId());
            try {
                if (sportDto.getIsEsport()) {
                    if (LocalDateTime.now().isAfter(competition.getStartDate().minusHours(1))) {
                        log.info("Auto-starting e-sport tournament: '{}'", competition.getName());
                        tournamentStageService.closeTournamentRegistrationAndGenerateTournamentStages(competition.getId());
                    }
                } else {
                    if (LocalDateTime.now().isAfter(competition.getStartDate().minusHours(24))) {
                        log.info("Auto-starting sport tournament: '{}'", competition.getName());
                        tournamentStageService.closeTournamentRegistrationAndGenerateTournamentStages(competition.getId());
                    }
                }
            } catch (Exception e) {
                log.error("Failed to start tournament '{}': {}", competition.getName(), e.getMessage(), e);
            }
        }
    }

}
