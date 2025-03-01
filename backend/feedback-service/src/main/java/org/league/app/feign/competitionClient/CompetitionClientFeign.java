package org.league.app.feign.competitionClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.util.Set;
import java.util.UUID;

@FeignClient("competition-management-service")
public interface CompetitionClientFeign {

    @GetMapping("/api/competition/get/{id}")
    CompetitionDto findById(@PathVariable("id") UUID id);

    @GetMapping("/api/competition/players/{competitionId}")
    Set<Long> findAllPlayersByCompetitionId(@PathVariable("competitionId") UUID competitionId);
}