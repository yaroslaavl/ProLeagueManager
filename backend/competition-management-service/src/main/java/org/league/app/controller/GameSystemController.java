package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.GameSystemCreateCompetitionDto;
import org.league.app.dto.GameSystemCreateEditDto;
import org.league.app.dto.GameSystemReadDto;
import org.league.app.service.GameSystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/game-system")
@RequiredArgsConstructor
public class GameSystemController {

    private final GameSystemService gameSystemService;

    @PostMapping("/create")
    public ResponseEntity<GameSystemReadDto> createGameSystem(@RequestBody GameSystemCreateEditDto gameSystemCreateEditDto) {
        return ResponseEntity.ok(gameSystemService.createGameSystem(gameSystemCreateEditDto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GameSystemReadDto> getGameSystemById(@PathVariable("id") Integer id) {
        GameSystemReadDto gameSystem = gameSystemService.getGameSystemById(id);
        return ResponseEntity.ok(gameSystem);
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<?> deleteGameSystem(@PathVariable("id") Integer id) {
        gameSystemService.deleteGameSystemById(id);
        return ResponseEntity.ok("Deleted GameSystem");
    }

    @GetMapping("/search")
    public ResponseEntity<List<GameSystemCreateCompetitionDto>> searchGameSystem(@RequestParam("query") String query) {
        List<GameSystemCreateCompetitionDto> gameSystemCreateCompetitionDtoList =
                gameSystemService.searchGameSystem(query);

        return ResponseEntity.ok(gameSystemCreateCompetitionDtoList);
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<GameSystemReadDto> updateGameSystemPartial(@PathVariable("id") Integer id, @RequestBody Map<String, Object> updates) {
        return ResponseEntity.ok(gameSystemService.updateGameSystemPartial(id, updates));
    }
}