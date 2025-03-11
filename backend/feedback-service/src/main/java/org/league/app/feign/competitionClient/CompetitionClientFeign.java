package org.league.app.feign.competitionClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@FeignClient("competition-management-service")
public interface CompetitionClientFeign {

    @Retry(name = "competitionServiceRetry", fallbackMethod = "fallbackCompetition")
    @GetMapping("/api/competition/get/{id}")
    CompetitionDto findById(@PathVariable("id") UUID id);

    default CompetitionDto fallbackCompetition(UUID id,
                                               Throwable t) {
        Logger logger = LoggerFactory.getLogger(CompetitionClientFeign.class);
        logger.warn("Competition service is down. ID: '{}'. Error: {}",
                id, t.getMessage());
        throw new RuntimeException("Service did not send data", t);
    }

    @GetMapping("/api/competition/players/{competitionId}")
    Set<Long> findAllPlayersByCompetitionId(@PathVariable("competitionId") UUID competitionId);
}