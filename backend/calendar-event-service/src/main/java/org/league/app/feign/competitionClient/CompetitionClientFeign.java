package org.league.app.feign.competitionClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient(name = "competition-management-service")
public interface CompetitionClientFeign {

    @GetMapping("/closest-tournaments")
    List<UUID> getClosestTournaments(@RequestParam("isEsport") Boolean isEsport);
}
