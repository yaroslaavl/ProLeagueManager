package org.league.app.feign.teamClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient("team-management-service")
public interface TeamClientFeign {

    @Retry(name = "teamServiceRetry", fallbackMethod = "fallbackTeamId")
    @GetMapping("/api/team/current/{id}")
    TeamFeignDto findTeamById(@PathVariable("id") UUID id);

    default String fallbackTeamId(UUID id, Throwable t) {
        Logger logger = LoggerFactory.getLogger(TeamClientFeign.class);
        logger.warn("Team service is down");
        throw new RuntimeException("Team service is down", t);
    }
}
