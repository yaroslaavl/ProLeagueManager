package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.database.entity.Competition;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.mapper.CompetitionMapper;
import org.league.app.service.CompetitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/competition")
public class CompetitionController {

    private final CompetitionMapper competitionMapper;
    private final CompetitionService competitionService;

    @PostMapping("/create-competition")
    public ResponseEntity<CompetitionReadDto> createCompetition (@RequestBody CompetitionCreateEditDto competitionCreate,
                                                                 @RequestParam("gameSystemId") Integer gameSystemId,
                                                                 @RequestParam("sportId") Integer sportId) {
        return ResponseEntity.ok(competitionService.createCompetition(competitionCreate, gameSystemId, sportId));
    }

    @GetMapping("/search-tournaments")
    public ResponseEntity<List<CompetitionReadDto>> findAllTournamentsByFiltersAndDynamicSearch(@RequestParam(required = false, name = "isIndividual") Boolean isIndividual,
                                                                                         @RequestParam(required = false, name = "status") String status,
                                                                                         @RequestParam(required = false, name = "keyword") String keyword) {
        List<Competition> allTournamentsByFiltersAndDynamicSearch = competitionService.findAllTournamentsByFiltersAndDynamicSearch(keyword, isIndividual, status);
        List<CompetitionReadDto> collect = allTournamentsByFiltersAndDynamicSearch.stream()
                .map(competitionMapper::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(collect);
    }
}
