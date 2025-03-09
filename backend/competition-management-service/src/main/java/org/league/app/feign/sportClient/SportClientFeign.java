package org.league.app.feign.sportClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient("sport-service")
public interface SportClientFeign {

    @GetMapping("/api/sport/get-sports-by-name")
    List<SportDto> findByNameSearch(@RequestParam("sportName") String sportName);

    @GetMapping("/api/sport/type-of-sport")
    List<SportDto> findAllByIsEsport(@RequestParam("isEsport") Boolean isEsport);

    @Retry(name = "sportServiceRetry", fallbackMethod = "fallbackSport")
    @GetMapping("/api/sport/id/{sportId}")
    SportDto findSportById(@PathVariable("sportId") Integer sportId);

    default SportDto fallbackSport(Integer sportId, Throwable t) {
        Logger logger = LoggerFactory.getLogger(SportClientFeign.class);
        logger.warn("Sport service is down.");
        throw new RuntimeException("Sport service is down.", t);
    }
}
