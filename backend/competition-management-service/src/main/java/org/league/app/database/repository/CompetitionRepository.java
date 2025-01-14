package org.league.app.database.repository;

import org.league.app.database.entity.Competition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, UUID> {

    Optional<Competition> findCompetitionByName(String competitionName);

}
