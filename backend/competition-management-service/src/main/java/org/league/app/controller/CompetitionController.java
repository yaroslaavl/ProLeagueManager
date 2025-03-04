package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.*;
import org.league.app.service.CompetitionService;
import org.league.app.service.MinioService;
import org.league.app.service.TournamentStageService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.springframework.http.ResponseEntity.noContent;
import static org.springframework.http.ResponseEntity.notFound;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/competition")
public class CompetitionController {

    private final CompetitionService competitionService;
    private final TournamentStageService tournamentStageService;
    private final MinioService minioService;

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

    @GetMapping("/get/{id}")
    public ResponseEntity<CompetitionReadDto> findById(@PathVariable("id") UUID id) {
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

    @PostMapping("/participation")
    public ResponseEntity<Boolean> addTeam (@RequestParam("competitionId") UUID competitionId,
                                            @RequestParam(required = false, name = "teamId") UUID teamId,
                                            @RequestParam(required = false, name = "selectedPlayersIds") List<Long> selectedPlayersIds) {
        return ResponseEntity.ok(competitionService.participation(competitionId, teamId, selectedPlayersIds));
    }

    @GetMapping("/count-of-signed-in")
    public ResponseEntity<Integer> countOfSignedInUsersOrTeams (@RequestParam("competitionId") UUID competitionId) {
        return ResponseEntity.ok(competitionService.countCurrentPlayersPerCompetition(competitionId));
    }

    @GetMapping("/players/{competitionId}/{teamId}")
    public ResponseEntity<Set<Long>> findCompetitionParticipantsById(@PathVariable("competitionId") UUID id, @PathVariable("teamId") UUID teamId) {
        Set<Long> competitionParticipantsById = competitionService.findCompetitionParticipantsByCompetitionIdAndTeamId(id, teamId);
        return ResponseEntity.ok(competitionParticipantsById);
    }

    @GetMapping("/players/{competitionId}")
    public Set<Long> findAllPlayersByCompetitionId(@PathVariable("competitionId") UUID id) {
        return competitionService.findAllPlayersByCompetitionId(id);
    }

    @GetMapping("/active-competitions")
    public List<CompetitionReadDto> getActiveCompetitions() {
        return competitionService.getActiveCompetitionIds();
    }

    @GetMapping("/last-day-active-leagues")
    public List<UUID> getLastDayActiveLeagues() {
        return competitionService.getLastDayActiveLeagues();
    }

    @GetMapping("/standings")
    public List<LeagueStandingDto> getLeagueStanding (@RequestParam("competitionId") UUID competitionId,
                                                      @RequestParam(required = false, name = "teamIds") List<UUID> teamIds,
                                                      @RequestParam(required = false, name = "playerIds") List<Long> playerIds) {
        return competitionService.getLeagueStandingByCompetitionIdAndTeamIdOrPlayerId(competitionId, teamIds, playerIds);
    }

    @PutMapping("/update-standing")
    public ResponseEntity<Void> updateLeagueStanding(@RequestBody List<LeagueStandingDto> leagueStandingReadDto) {
        competitionService.updateLeagueStanding(leagueStandingReadDto);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/league-table/{leagueId}")
    public ResponseEntity<List<LeagueStandingDto>> getLeagueTableByCompetitionId(@PathVariable("leagueId") UUID leagueId) {
        return ResponseEntity.ok(competitionService.showLeagueTableByLeagueId(leagueId));
    }

    @GetMapping("/user")
    public ResponseEntity<List<CompetitionReadDto>> getCompetitionsByUser(@RequestParam("userId") Long userId,
                                                                          @RequestParam("competitionType") String competitionType) {
        return ResponseEntity.ok(competitionService.findCompetitionByUserId(userId, competitionType));
    }

    @GetMapping("/team")
    public UUID getTeamByUser(@RequestParam("userId") Long userId) {
        return competitionService.findTeamByUser(userId);

    @GetMapping("/stages")
    public List<TournamentStageReadDto> findAllStagesByCompetitionIdSortedByStageOrder(@RequestParam("competitionId") UUID competitionId) {
        return tournamentStageService.findAllStagesByCompetitionIdSortedByStageOrder(competitionId);
    }

    @PostMapping("/upload-image/{competitionId}")
    public void uploadCompetitionImage(@PathVariable("competitionId") UUID competitionId,
                                       @Validated({CreateAction.class, EditAction.class}) UploadCompetitionImageDto uploadCompetitionImageDto) {
        minioService.uploadImage(competitionId, uploadCompetitionImageDto);
    }

    @GetMapping("/get-image/{competitionId}")
    public ResponseEntity<String> getCompetitionImage(@PathVariable("competitionId") UUID competitionId) {
        return ResponseEntity.ok(minioService.getCompetitionImage(competitionId));

    }
}
