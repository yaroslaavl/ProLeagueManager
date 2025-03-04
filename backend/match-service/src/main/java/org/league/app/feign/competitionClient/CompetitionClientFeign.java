package org.league.app.feign.competitionClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.league.app.broker.CompetitionDto;
import org.league.app.broker.LeagueStandingDto;
import org.league.app.broker.TournamentStageDto;
import org.league.app.feign.notificationClient.NotificationClientFeign;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@FeignClient("competition-management-service")
public interface CompetitionClientFeign {

    @GetMapping("/api/competition/players/{competitionId}/{teamId}")
    Set<Long> findCompetitionParticipantsById(@PathVariable("competitionId") UUID id, @PathVariable("teamId") UUID teamId);

    @Retry(name = "competitionRetry", fallbackMethod = "fallbackCompetition")
    @GetMapping("/api/competition/get/{id}")
    CompetitionDto findById(@PathVariable("id") UUID id);

    default CompetitionDto fallbackCompetition(UUID id,
                                                 Throwable t) {
        Logger logger = LoggerFactory.getLogger(NotificationClientFeign.class);
        logger.warn("Competition service is down. ID: '{}'. Error: {}",
                id, t.getMessage());
        throw new RuntimeException("Competition service is down", t);
    }

    @GetMapping("/api/competition/active-competitions")
    List<CompetitionDto> getActiveCompetitions();

    @GetMapping("/api/competition/last-day-active-leagues")
    List<UUID> getLastDayActiveLeagues();

    @GetMapping("/api/competition/standings")
    List<LeagueStandingDto> getLeagueStanding (@RequestParam("competitionId") UUID competitionId,
                                         @RequestParam(required = false, name = "teamIds") List<UUID> teamIds,
                                         @RequestParam(required = false, name = "playerIds") List<Long> playerIds);

    @PutMapping("/api/competition/update-standing")
    ResponseEntity<Void> updateLeagueStanding(@RequestBody List<LeagueStandingDto> leagueStandingReadDto);

    @GetMapping("/api/competition/team")
    UUID getTeamByUser(@RequestParam("userId") Long userId);

    @GetMapping("/api/competition/stages")
    List<TournamentStageDto> findAllStagesByCompetitionIdSortedByStageOrder(@RequestParam("competitionId") UUID competitionId);
}
