package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.mapper.CompetitionMapper;
import org.league.app.service.CompetitionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.ResponseEntity.noContent;
import static org.springframework.http.ResponseEntity.notFound;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/competition")
public class CompetitionController {

    private final CompetitionMapper competitionMapper;
    private final CompetitionService competitionService;

    @PostMapping("/create")
    public ResponseEntity<CompetitionReadDto> createCompetition (@RequestBody CompetitionCreateEditDto competitionCreate,
                                                                 @RequestParam("gameSystemId") Integer gameSystemId,
                                                                 @RequestParam("sportId") Integer sportId) {
        return ResponseEntity.ok(competitionService.createCompetition(competitionCreate, gameSystemId, sportId));
    }

    @GetMapping("/search-tournaments")
    public ResponseEntity<List<CompetitionReadDto>> findAllTournamentsByFiltersAndDynamicSearch(
            @RequestParam(required = false, name = "keyword") String keyword,
            @RequestParam(required = false, name = "isIndividual") Boolean isIndividual,
            @RequestParam(required = false, name = "status") String status,
            @RequestParam(required = false, name = "isEsport") Boolean isEsport) {
        List<CompetitionReadDto> allTournamentsByFiltersAndDynamicSearch =
                competitionService.findAllTournamentsByFiltersAndDynamicSearch(keyword, isIndividual, status, isEsport);

        return ResponseEntity.ok(allTournamentsByFiltersAndDynamicSearch);
    }

    @GetMapping("/search-leagues")
    public ResponseEntity<List<CompetitionReadDto>> findAllLeaguesByFilters(
            @RequestParam(required = false, name = "isIndividual") Boolean isIndividual,
            @RequestParam(required = false, name = "isEsport") Boolean isEsport) {
        List<CompetitionReadDto> allLeaguesByFilters = competitionService.findAllLeaguesByFilters(isIndividual, isEsport);

        return ResponseEntity.ok(allLeaguesByFilters);
    }

    @GetMapping("/all")
    public List<CompetitionReadDto> findAllCompetitions() {
        return competitionService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<CompetitionReadDto> findById(@PathVariable UUID id) {
        return ResponseEntity.ok(competitionService.findById(id));
    }

    @PutMapping("/edit/{competitionName}")
    public ResponseEntity<CompetitionReadDto> editCompetition (@PathVariable("competitionName") String competitionName,
                                                               @RequestBody CompetitionCreateEditDto newCompetition) {
        return ResponseEntity.ok(competitionService.edit(competitionName, newCompetition));
    }

    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteCompetition (@RequestParam("competitionName") String competitionName) {
        return competitionService.delete(competitionName)
                ? noContent().build()
                : notFound().build();
    }

    @PostMapping("/add-team")
    public ResponseEntity<Boolean> addTeam (@RequestParam("competitionId") UUID competitionId,
                                            @RequestParam("teamId") UUID teamId,
                                            @RequestParam("selectedPlayersIds") List<Long> selectedPlayersIds) {
        return ResponseEntity.ok(competitionService.addTeamToCompetition(competitionId, teamId, selectedPlayersIds));
    }
}
