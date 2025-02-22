package org.league.app.feign.competitionClient;

import org.league.app.broker.CompetitionDto;
import org.league.app.broker.LeagueStandingDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

@FeignClient("competition-management-service")
public interface CompetitionClientFeign {

    @GetMapping("/api/competition/players/{competitionId}/{teamId}")
    Set<Long> findCompetitionParticipantsById(@PathVariable("competitionId") UUID id, @PathVariable("teamId") UUID teamId);

    @GetMapping("/api/competition/get/{id}")
    CompetitionDto findById(@PathVariable("id") UUID id);

    @GetMapping("/api/competition/active-competitions")
    public List<UUID> getActiveCompetitions();

    @GetMapping("/api/competition/active-leagues")
    List<UUID> getActiveLeagues();

    @GetMapping("/api/competition/standings")
    List<LeagueStandingDto> getLeagueStanding (@RequestParam("competitionId") UUID competitionId,
                                         @RequestParam(required = false, name = "teamIds") List<UUID> teamIds,
                                         @RequestParam(required = false, name = "playerIds") List<Long> playerIds);

    @PutMapping("/api/competition/update-standing")
    ResponseEntity<Void> updateLeagueStanding(@RequestBody List<LeagueStandingDto> leagueStandingReadDto);
}
