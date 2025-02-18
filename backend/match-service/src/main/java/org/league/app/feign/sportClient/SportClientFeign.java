package org.league.app.feign.sportClient;

import org.league.app.broker.SportDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient("sport-service")
public interface SportClientFeign {

    @GetMapping("/api/sport/id/{sportId}")
    SportDto findSportById(@PathVariable("sportId") Integer sportId);
}
