package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.MatchReadDto;
import org.league.app.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Repository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.util.UUID;

@Repository
@RequiredArgsConstructor
@RequestMapping("/api/match")
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/id/{matchId}")
    public ResponseEntity<MatchReadDto> findById(@PathVariable("matchId") UUID id) {
        MatchReadDto matchById = matchService.findMatchById(id);
        return ResponseEntity.ok(matchById);
    }
}
