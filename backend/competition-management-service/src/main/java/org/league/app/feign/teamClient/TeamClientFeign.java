package org.league.app.feign.teamClient;

import org.league.app.feign.sportClient.SportDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;

@FeignClient("team-management-service")
public interface TeamClientFeign {

    /*@GetMapping("/api/team/get-teams-by-userId")
    List<Team> findTeamsByUserId(@RequestParam("userId") Long userId);*/
}
