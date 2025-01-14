package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.service.CompetitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/competition")
public class CompetitionController {

    private final CompetitionService competitionService;

    @PostMapping("/create-competition")
    public ResponseEntity<CompetitionReadDto> createCompetition (@RequestBody CompetitionCreateEditDto competitionCreate,
                                                                 @RequestParam("gameSystemId") Integer gameSystemId,
                                                                 @RequestParam("sportId") Integer sportId) {
        return ResponseEntity.ok(competitionService.createCompetition(competitionCreate, gameSystemId, sportId));
    }
}
