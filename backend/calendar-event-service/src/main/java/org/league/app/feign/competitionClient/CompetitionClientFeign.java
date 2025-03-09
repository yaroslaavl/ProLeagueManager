package org.league.app.feign.competitionClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@FeignClient(name = "competition-management-service")
public interface CompetitionClientFeign {

    @Retry(name = "tournamentRetry", fallbackMethod = "fallbackCompetition")
    @GetMapping("/api/competition/closest-tournaments")
    List<UUID> getClosestTournaments(@RequestParam("isEsport") Boolean isEsport);

    @Retry(name = "leagueRetry", fallbackMethod = "fallbackCompetition")
    @GetMapping("/api/competition/closest-leagues")
    List<UUID> getClosestLeagues(@RequestParam("isEsport") Boolean isEsport);

    @GetMapping("/api/competition/get-image/{competitionId}")
    String getCompetitionImage(@PathVariable("competitionId") UUID competitionId);

    default List<UUID> fallbackCompetition(Boolean isEsport,
                                               Throwable t) {
        Logger logger = LoggerFactory.getLogger(CompetitionClientFeign.class);
        logger.warn("Competition service returned an error. Returning empty list. isEsport={}, error={}", isEsport, t.getMessage());
        return Collections.emptyList();
    }
}
