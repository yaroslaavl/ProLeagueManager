package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.GameSystemCreateEditDto;
import org.league.app.dto.GameSystemReadDto;
import org.league.app.service.GameSystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/game-system")
@RequiredArgsConstructor
public class GameSystemController {

    private final GameSystemService gameSystemService;

    @PostMapping("/create-game-system")
    public ResponseEntity<GameSystemReadDto> createGameSystem(@RequestBody GameSystemCreateEditDto gameSystemCreateEditDto) {
        return ResponseEntity.ok(gameSystemService.createGameSystem(gameSystemCreateEditDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameSystemReadDto> getGameSystemById(@PathVariable("id") Integer id) {
        GameSystemReadDto gameSystem = gameSystemService.getGameSystemById(id);
        return ResponseEntity.ok(gameSystem);
    }
}
