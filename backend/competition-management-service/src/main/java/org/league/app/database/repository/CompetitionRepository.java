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

    @Query("SELECT c FROM Competition c WHERE c.status = 'ACTIVE'")
    List<Competition> getActiveCompetitions();

    @Query(value = "SELECT c.id FROM competition_management.competition c " +
                   "WHERE c.competition_status = 'ACTIVE' " +
                   "AND c.competition_type = 'LEAGUE' " +
                   "AND now() BETWEEN c.end_date::DATE " +
                   "AND c.end_date", nativeQuery = true)
    List<UUID> getLastDayActiveLeagues();

    @Query("SELECT c FROM Competition c " +
            "WHERE c.competitionType = 'TOURNAMENT' " +
            "AND c.startDate >= CURRENT_DATE " +
            "AND c.status = 'UPCOMING' " +
            "ORDER BY c.startDate ASC")
    List<Competition> findClosestTournaments();

    @Query("SELECT c FROM Competition c " +
            "WHERE c.competitionType = 'LEAGUE' " +
            "AND (c.status = 'UPCOMING' OR c.status = 'ACTIVE') " +
            "ORDER BY c.status DESC, c.startDate ASC")
    List<Competition> findClosestAndActiveLeagues();
}
