package org.league.app.service.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.broker.CompetitionDto;
import org.league.app.database.entity.Match;
import org.league.app.database.entity.enums.MatchStatus;
import org.league.app.database.repository.MatchRepository;
import org.league.app.feign.competitionClient.CompetitionClientFeign;
import org.league.app.service.MatchService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MatchScheduler {

    private final MatchService matchService;
    private final CompetitionClientFeign competitionClient;
    private final MatchRepository matchRepository;
    private List<UUID> activeTournamentCache = new ArrayList<>();
    private List<UUID> activeCompetitionCache = new ArrayList<>();
    private List<UUID> activeLastDayLeaguesCache = new ArrayList<>();

    @Scheduled(fixedDelay = 45000)
    public void updateActiveTournamentsAndLeaguesCache() {
        List<CompetitionDto> activeCompetitions = competitionClient.getActiveCompetitions();

        activeCompetitionCache = activeCompetitions.stream()
                .map(CompetitionDto::getId)
                .toList();
        log.info("Updated active competitions cache: {}", activeCompetitionCache.size());

        activeTournamentCache = activeCompetitions.stream()
                .filter(competition -> "TOURNAMENT".equalsIgnoreCase(competition.getCompetitionType()))
                .map(CompetitionDto::getId)
                .toList();

        activeLastDayLeaguesCache = competitionClient.getLastDayActiveLeagues();
        log.info("Updated last day active leagues cache: {}", activeLastDayLeaguesCache.size());
    }

    @Scheduled(fixedDelay = 30000)
    public void processScheduledCompetitionMatches() {
        if (activeCompetitionCache.isEmpty()) {
            return;
        }

        List<Match> matchesByMatchStatus = matchRepository.findScheduledMatchesByActiveCompetitions(activeCompetitionCache);
        log.info("Match confirmation check 5 minutes before the start of the match at {}", LocalDateTime.now());

        for (Match match : matchesByMatchStatus) {
            if (LocalDateTime.now().isAfter(match.getMatchDate().minusMinutes(5))) {
                matchService.checkMatchParticipantConfirmation(match);
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

        List<Match> tournamentMatchesByMatchStatus = matchRepository.findFinishedMatchesByActiveTournamentId(activeTournamentCache);
        log.info("Checking match winners at {}", LocalDateTime.now());

        for (Match match : tournamentMatchesByMatchStatus) {
            if (match.getWinnerPlayerId() != null || match.getWinnerTeamId() != null) {
                matchService.processNextMatch(match);
            }
        }
    }

    @Scheduled(fixedRate = 60000)
    public void checkLeagueEnding() {
        if (activeLastDayLeaguesCache.isEmpty()) {
            return;
        }

        log.info("Checking last match in league ending at {}", LocalDateTime.now());
        for (UUID competitionId : activeLastDayLeaguesCache) {
            matchService.lastMatchProcessing(competitionId);
        }
    }
}
