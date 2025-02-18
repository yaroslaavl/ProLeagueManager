package org.league.app.database.repository;

import org.league.app.database.entity.Match;
import org.league.app.database.entity.enums.MatchStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID> {

    @Query("SELECT m FROM Match m WHERE m.matchStatus = 'SCHEDULED' AND m.competitionId IN :activeTournamentIds")
    List<Match> findScheduledMatchesByActiveTournaments(@Param("activeTournamentIds") List<UUID> activeTournamentIds);

    @Query("SELECT m FROM Match m WHERE m.matchStatus = 'IN_PROGRESS' AND m.competitionId IN :activeTournamentIds")
    List<Match> findInProgressMatchesByActiveTournamentId(@Param("activeTournamentIds") List<UUID> activeTournamentId);

    List<Match> findMatchByStageId(UUID stageId);

    Optional<Match> findById(UUID uuid);
}