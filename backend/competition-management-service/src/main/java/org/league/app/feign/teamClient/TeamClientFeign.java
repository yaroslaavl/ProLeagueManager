package org.league.app.feign.teamClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.UUID;

@FeignClient("team-management-service")
public interface TeamClientFeign {

    @GetMapping("/api/team/current/{id}")
    TeamFeignDto findTeamById(@PathVariable("id") UUID id);
}
