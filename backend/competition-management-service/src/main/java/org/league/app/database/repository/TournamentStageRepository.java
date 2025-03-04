package org.league.app.database.repository;

import org.league.app.database.entity.TournamentStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TournamentStageRepository extends JpaRepository<TournamentStage, UUID> {

    List<TournamentStage> findTournamentStagesByCompetitionId(UUID competitionId);

    @Query("SELECT t FROM TournamentStage t WHERE t.competition.id = :competitionId ORDER BY t.stageOrder ASC")
    List<TournamentStage> findAllStagesByCompetitionIdSortedByStageOrder(@Param("competitionId") UUID competitionId);
}
