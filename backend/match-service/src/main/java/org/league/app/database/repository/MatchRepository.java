package org.league.app.database.repository;

import org.league.app.database.entity.Match;
import org.league.app.dto.ToursWithTimeGapDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MatchRepository extends JpaRepository<Match, UUID>, JpaSpecificationExecutor<Match> {

    @Query("SELECT m FROM Match m WHERE m.matchStatus = 'SCHEDULED' AND m.competitionId IN :activeCompetitionIds")
    List<Match> findScheduledMatchesByActiveCompetitions(@Param("activeCompetitionIds") List<UUID> activeCompetitionIds);

    @Query("SELECT m FROM Match m WHERE m.matchStatus = 'FINISHED' AND m.competitionId IN :activeTournamentIds")
    List<Match> findFinishedMatchesByActiveTournamentId(@Param("activeTournamentIds") List<UUID> activeTournamentIds);

    List<Match> findMatchByStageId(UUID stageId);

    Match findTopByCompetitionIdOrderByMatchDateDesc(UUID competitionId);

    @Query("SELECT new org.league.app.dto.ToursWithTimeGapDto(m.leagueTourNumber, MIN(m.matchDate), MAX(m.matchDate)) " +
            "FROM Match m WHERE m.competitionId = :competitionId " +
            "GROUP BY m.leagueTourNumber ORDER BY m.leagueTourNumber")
    List<ToursWithTimeGapDto> findAllLeagueTourNumbersWithTimeGap(@Param("competitionId") UUID competitionId);

    List<Match> findAllByCompetitionIdAndLeagueTourNumberOrderByMatchDateAsc(UUID competitionId, Integer leagueTourNumber);
}