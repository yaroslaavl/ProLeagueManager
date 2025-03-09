package org.league.app.service.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Event;
import org.league.app.database.entity.enums.EventType;
import org.league.app.database.repository.EventRepository;
import org.league.app.feign.competitionClient.CompetitionClientFeign;
import org.league.app.feign.matchClient.MatchClientFeign;
import org.league.app.service.EventService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import java.util.*;
import java.util.concurrent.locks.ReentrantLock;

@Slf4j
@Component
@RequiredArgsConstructor
public class EventScheduler {

    private final EventService eventService;
    private final EventRepository eventRepository;
    private final MatchClientFeign matchClientFeign;
    private final CompetitionClientFeign competitionClientFeign;

    private final List<UUID> tournamentCache = new ArrayList<>();
    private final Map<UUID, Boolean> tournamentTypeMap = new HashMap<>();

    private final List<UUID> leagueCache = new ArrayList<>();
    private final Map<UUID, Boolean> leagueTypeMap = new HashMap<>();

    private final List<UUID> matchCache = new ArrayList<>();
    private final Map<UUID, Boolean> matchTypeMap = new HashMap<>();

    private final ReentrantLock lock = new ReentrantLock();

    @Scheduled(fixedDelay = 30000)
    public void executeScheduledTasks() {
        try {
            lock.lock();

            updateTournamentAndLeagueCache();

            updateTopMatchesCache();

            createAutoTournamentEvents();
            createAutoLeagueEvents();
            createAutoTopMatchesEvents();
        } finally {
            lock.unlock();
        }
    }

    private void updateTournamentAndLeagueCache() {
        List<UUID> tournamentCacheByEsport = competitionClientFeign.getClosestTournaments(Boolean.TRUE);
        List<UUID> tournamentCacheBySport = competitionClientFeign.getClosestTournaments(Boolean.FALSE);
        List<UUID> leagueCacheByEsport = competitionClientFeign.getClosestLeagues(Boolean.TRUE);
        List<UUID> leagueCacheBySport = competitionClientFeign.getClosestLeagues(Boolean.FALSE);

        log.info("Updated tournament by e-sport type cache: {}", tournamentCacheByEsport.size());
        log.info("Updated tournament by sport type cache: {}", tournamentCacheBySport.size());
        log.info("Updated league by e-sport type cache: {}", leagueCacheByEsport.size());
        log.info("Updated league by sport type cache: {}", leagueCacheBySport.size());

        listPreparation(tournamentCacheByEsport, tournamentCacheBySport, tournamentCache, tournamentTypeMap);
        listPreparation(leagueCacheByEsport, leagueCacheBySport, leagueCache, leagueTypeMap);
    }

    private void updateTopMatchesCache() {
        List<UUID> upcomingTopMatchesByEsport = matchClientFeign.findUpcomingTopMatchesByStage(Boolean.TRUE);
        List<UUID> upcomingTopMatchesBySport = matchClientFeign.findUpcomingTopMatchesByStage(Boolean.FALSE);

        log.info("Updated top match by e-sport type cache: {}", upcomingTopMatchesByEsport.size());
        log.info("Updated top match by sport type cache: {}", upcomingTopMatchesBySport.size());

        listPreparation(upcomingTopMatchesByEsport, upcomingTopMatchesBySport, matchCache, matchTypeMap);
    }

    private void createAutoTournamentEvents() {
        log.info("Cache tournament size: {}", tournamentCache.size());
        List<Event> tournaments = eventRepository.findEventsByTournamentIds(tournamentCache);
        log.info("Tournament events: {}", tournaments.size());

        eventService.processEvent(EventType.TOURNAMENT, tournaments, tournamentCache, tournamentTypeMap, false);
    }

    private void createAutoLeagueEvents() {
        log.info("Cache league size: {}", leagueCache.size());
        List<Event> leagues = eventRepository.findEventsByLeagueIds(leagueCache);
        log.info("League events: {}", leagues.size());

        eventService.processEvent(EventType.LEAGUE, leagues, leagueCache, leagueTypeMap, false);
    }

    private void createAutoTopMatchesEvents() {
        log.info("Cache match size: {}", matchCache.size());
        List<Event> matches = eventRepository.findEventsByMatchIds(matchCache);
        log.info("Matches events: {}", matches.size());

        eventService.processEvent(EventType.MATCH, matches, matchCache, matchTypeMap, true);
    }

    private void listPreparation(List<UUID> esportList, List<UUID> sportList, List<UUID> cache, Map<UUID, Boolean> typeMap) {
        cache.clear();
        typeMap.clear();

        esportList.forEach(id -> {
            cache.add(id);
            typeMap.put(id, Boolean.TRUE);
        });

        sportList.forEach(id -> {
            cache.add(id);
            typeMap.put(id, Boolean.FALSE);
        });
    }
}
