package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.TeamCreateEditDto;
import org.league.app.dto.TeamReadDto;
import org.league.app.service.TeamService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/team")
public class TeamController {

    private final TeamService teamService;

    @PostMapping("/create-team")
    public ResponseEntity<TeamReadDto> createTeam(TeamCreateEditDto teamCreateDto) {
        TeamReadDto team = teamService.createTeam(teamCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(team);
    }

    @GetMapping("/players")
    public String getPlayers() {
        return "Ronaldo: PLAYER";
    }
}
