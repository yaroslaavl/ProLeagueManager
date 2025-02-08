package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.service.TournamentStageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/stage")
public class TournamentStageController {

    private final TournamentStageService tournamentStageService;

    @PostMapping("/{competitionId}")
    public ResponseEntity<String> generateTournamentStages(@PathVariable("competitionId") UUID competitionId) {
        tournamentStageService.generateTournamentStages(competitionId);
        return ResponseEntity.ok("Tournament stage generated");
    }

}
