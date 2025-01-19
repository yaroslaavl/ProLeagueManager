package org.league.app.feign.sportClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient("sport-service")
public interface SportClientFeign {

    @GetMapping("/api/sport/get-sports-by-name")
    List<SportDto> findByNameSearch(@RequestParam("sportName") String sportName);

    @GetMapping("/api/sport/type-of-sport")
    List<SportDto> findAllByIsEsport(@RequestParam("isEsport") Boolean isEsport);
}
