package org.league.app.feign.matchClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@FeignClient("match-service")
public interface MatchClientFeign {

    @Retry(name = "matchServiceRetry", fallbackMethod = "fallbackMatch")
    @GetMapping("/api/match/upcoming-top")
    List<UUID> findUpcomingTopMatchesByStage(@RequestParam("isEsport") Boolean isEsport);

    default List<UUID> fallbackMatch(Boolean isEsport,
                                           Throwable t) {
        Logger logger = LoggerFactory.getLogger(MatchClientFeign.class);
        logger.warn("Match service returned an error. Returning empty list. isEsport={}, error={}", isEsport, t.getMessage());
        return Collections.emptyList();
    }
}
