package org.league.app.service.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.feign.competitionClient.CompetitionClientFeign;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventScheduler {

    private final CompetitionClientFeign competitionClientFeign;
    private List<UUID> tournamentCacheByEsport = new ArrayList<>();
    private List<UUID> tournamentCacheBySport = new ArrayList<>();

    @Scheduled(fixedDelay = 180000)
    public void updateTournamentCache() {
        tournamentCacheByEsport = competitionClientFeign.getClosestTournaments(true);
        log.info("Updated active tournament by sport type cache: {}", tournamentCacheByEsport.size());

        tournamentCacheBySport = competitionClientFeign.getClosestTournaments(false);
        log.info("Updated active tournament by e-sport type cache: {}", tournamentCacheBySport.size());
    }
}
