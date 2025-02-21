package org.league.app.database.repository;

import org.league.app.database.entity.Competition;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionRepository extends JpaRepository<Competition, UUID>, JpaSpecificationExecutor<Competition> {

    Optional<Competition> findCompetitionByName(String competitionName);

    int deleteCompetitionByName(String competitionName);

    List<Competition> findAllByStatusAndCompetitionType(CompetitionStatus status, CompetitionType competitionType);

    @Query("SELECT c.id FROM Competition c WHERE c.status = 'ACTIVE'")
    List<UUID> getActiveCompetitions();

    @Query(value = "SELECT c.id FROM Competition c WHERE c.status = 'ACTIVE' AND c.competitionType = 'LEAGUE' AND now() between c.endDate::DATE and c.endDate", nativeQuery = true)
    List<UUID> getLastDayActiveLeagues();
}
