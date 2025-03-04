package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Match;
import org.league.app.dto.MatchCreateEditDto;
import org.league.app.dto.MatchReadDto;
import org.league.app.dto.ToursWithTimeGapDto;
import org.league.app.service.MatchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/match")
public class MatchController {

    private final MatchService matchService;

    @GetMapping("/id/{matchId}")
    public ResponseEntity<MatchReadDto> findById(@PathVariable("matchId") UUID id) {
        MatchReadDto matchById = matchService.findMatchById(id);
        return ResponseEntity.ok(matchById);
    }

    @PutMapping("/confirmation")
    public ResponseEntity<Boolean> confirmMatch(@RequestParam("matchId") UUID matchId,
                                                @RequestParam(required = false, name = "teamId") UUID teamId,
                                                @RequestParam("userId") Long userId,
                                                @RequestParam(required = false, name = "playerIds") List<Long> playerIds) {
        log.info("Received match confirmation request: matchId={}, teamId={}, userId={}, playerIds={}",
                matchId, teamId, userId, playerIds);

        boolean isConfirmed = matchService.matchConfirmation(matchId, teamId, userId, playerIds);
        return ResponseEntity.ok(isConfirmed);
    }

    @PutMapping("/{matchId}/score")
    public ResponseEntity<Void> editMatchScore(@PathVariable("matchId") UUID matchId,
                                               @RequestBody MatchCreateEditDto matchCreateEditDto) {

        matchService.editMatchScore(matchId, matchCreateEditDto);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/qr-review")
    public ResponseEntity<Void> confirmAfterQrCodeReview(@RequestParam("matchId") UUID matchId,
                                                         @RequestBody MatchCreateEditDto matchCreateEditDto) {
        System.out.println("matchId: " + matchId);
        System.out.println("AConfirmed: " + matchCreateEditDto.getAConfirmed());
        System.out.println("BConfirmed: " + matchCreateEditDto.getBConfirmed());

        matchService.confirmAfterQrCodeReview(matchId, matchCreateEditDto);
        return ResponseEntity.noContent().build();
    }


    @GetMapping("/leagueTours/{leagueId}")
    public ResponseEntity<List<ToursWithTimeGapDto>> findAllLeagueTours(@PathVariable("leagueId") UUID leagueId) {
       return ResponseEntity.ok(matchService.findAllTourLeagueWithTimeGap(leagueId));
    }

    @GetMapping("/tourMatches/{leagueId}")
    public ResponseEntity<List<Match>> findAllByCompetitionAndLeagueTourNumber(@PathVariable("leagueId") UUID leagueId,
                                                                               @RequestParam("leagueTourNumber") Integer leagueTourNumber) {
        return ResponseEntity.ok(matchService.findAllByCompetitionAndLeagueTourNumber(leagueId, leagueTourNumber));
    }

    @GetMapping("/dynamic-all/{tournamentId}")
    public List<MatchReadDto> findAllDynamicallyByTournamentId(@PathVariable("tournamentId") UUID tournamentId,
                                                               @RequestParam("matchStatuses") List<String> matchStatuses) {
        return matchService.findFilteredMatchesByTournamentId(tournamentId, matchStatuses);
    }

    @GetMapping("/user")
    public ResponseEntity<List<MatchReadDto>> findAllMatchesByUser(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(matchService.findAllMatchesWhereUserParticipated(userId));
    }

}
