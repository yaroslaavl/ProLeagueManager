package org.league.app.feign.sportClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.league.app.broker.SportDto;
import org.league.app.feign.notificationClient.NotificationClientFeign;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient("sport-service")
public interface SportClientFeign {

    @Retry(name = "sportServiceRetry", fallbackMethod = "fallbackSport")
    @GetMapping("/api/sport/id/{sportId}")
    SportDto findSportById(@PathVariable("sportId") Integer sportId);

    default SportDto fallbackSport(Integer sportId, Throwable t) {
        Logger logger = LoggerFactory.getLogger(NotificationClientFeign.class);
        logger.warn("Sport service is down.");
        throw new RuntimeException("Sport service is down.", t);
    }
}
