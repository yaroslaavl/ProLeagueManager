package org.league.app.database.repository;

import org.league.app.database.entity.CompetitionStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CompetitionStageRepository extends JpaRepository<CompetitionStage, UUID> {

}
