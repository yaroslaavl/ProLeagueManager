package org.league.app.database.repository;

import org.league.app.database.entity.Competition;
import org.league.app.database.entity.TournamentStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.expression.spel.ast.OpAnd;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TournamentStageRepository extends JpaRepository<TournamentStage, UUID> {

    Optional<TournamentStage> findTournamentStagesByCompetition(Competition competition);
}
