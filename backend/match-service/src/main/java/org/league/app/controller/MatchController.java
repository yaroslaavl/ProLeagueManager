package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.dto.MatchReadDto;
import org.league.app.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/match")
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/id/{matchId}")
    public ResponseEntity<MatchReadDto> findById(@PathVariable("matchId") UUID id) {
        MatchReadDto matchById = matchService.findMatchById(id);
        return ResponseEntity.ok(matchById);
    }

    @PutMapping("/confirmation")
    public ResponseEntity<Boolean> confirmMatch(@RequestParam("matchId") UUID matchId,
                                                @RequestParam(required = false, name = "teamId") UUID teamId,
                                                @RequestParam("userId") Long userId,
                                                @RequestParam(required = false, name = "playerIds") List<Long> playerIds) {
        log.info("Received match confirmation request: matchId={}, teamId={}, userId={}, playerIds={}",
                matchId, teamId, userId, playerIds);

        boolean isConfirmed = matchService.matchConfirmation(matchId, teamId, userId, playerIds);
        return ResponseEntity.ok(isConfirmed);
    }
}
