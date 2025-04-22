package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.dto.GameSystemCreateCompetitionDto;
import org.league.app.dto.GameSystemCreateEditDto;
import org.league.app.dto.GameSystemReadDto;
import org.league.app.service.GameSystemService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/game-system")
@RequiredArgsConstructor
public class GameSystemController {

    private final GameSystemService gameSystemService;

    @PostMapping("/create")
    public ResponseEntity<GameSystemReadDto> createGameSystem(@RequestBody GameSystemCreateEditDto gameSystemCreateEditDto) {
        log.info("Creating game system: {}", gameSystemCreateEditDto);
        GameSystemReadDto createdGameSystem = gameSystemService.createGameSystem(gameSystemCreateEditDto);
        return ResponseEntity.ok(createdGameSystem);
    }

    @GetMapping("/get/{id}")
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
    public ResponseEntity<List<GameSystemCreateCompetitionDto>> searchGameSystem(@RequestParam("keyword") String keyword) {
        log.info("Searching game systems with keyword: {}", keyword);
        List<GameSystemCreateCompetitionDto> results = gameSystemService.searchGameSystem(keyword);
        log.info("Found {} game systems", results.size());
        return ResponseEntity.ok(results);
    }

    @PatchMapping("/update/{id}")
    public ResponseEntity<GameSystemReadDto> updateGameSystemPartial(@PathVariable("id") Integer id,
                                                                     @RequestBody Map<String, Object> updates) {
        log.info("Updating game system with id={}, updates={}", id, updates);
        GameSystemReadDto updatedGameSystem = gameSystemService.updateGameSystemPartial(id, updates);
        return ResponseEntity.ok(updatedGameSystem);
    }
}
