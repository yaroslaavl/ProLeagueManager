package org.league.app.database.repository;

import org.league.app.database.entity.Event;
import org.league.app.database.entity.enums.EventType;
import org.league.app.database.entity.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EventRepository extends JpaRepository<Event, UUID> {

    @Query("SELECT e FROM Event e WHERE e.competitionId IN :tournamentIds AND e.status = 'PUBLISHED' AND e.eventType = 'TOURNAMENT'")
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    List<Event> findEventsByTournamentIds(@Param("tournamentIds") List<UUID> tournamentIds);

    @Query("SELECT e FROM Event e WHERE e.competitionId IN :leagueIds AND e.status = 'PUBLISHED' AND e.eventType = 'LEAGUE'")
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    List<Event> findEventsByLeagueIds(@Param("leagueIds") List<UUID> leagueIds);

    @Query("SELECT e FROM Event e WHERE e.matchId IN :matchIds AND e.status = 'PUBLISHED' AND e.eventType = 'MATCH'")
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    List<Event> findEventsByMatchIds(@Param("matchIds") List<UUID> matchIds);

    List<Event> findEventsByEventTypeAndStatus(EventType eventType, Status status);

    int countEventsByIsPinnedTrue();

    int countByIsPinnedTrueAndEventType(EventType eventType);

    List<Event> findAllByStatusAndIsPinnedFalse(Status status);

    List<Event> findAllByIsPinnedTrue();

    @Modifying
    @Query("UPDATE Event e SET e.status = :status, e.isPinned = false WHERE e.id IN :eventIds")
    void changeEventsStatus(@Param("status") Status status, @Param("eventIds") List<UUID> eventIds);
}
