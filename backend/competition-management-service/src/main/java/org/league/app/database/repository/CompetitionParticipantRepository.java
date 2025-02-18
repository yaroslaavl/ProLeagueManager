package org.league.app.database.repository;

import org.league.app.database.entity.CompetitionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionParticipantRepository extends JpaRepository<CompetitionParticipant, UUID> {

    @Query("SELECT CASE " +
            "WHEN c.gameSystem.isIndividual = TRUE THEN " +
                "(SELECT COUNT(cp.playerId) FROM CompetitionParticipant cp WHERE cp.competition.id = c.id) " +
            "ELSE " +
                "(SELECT COUNT(DISTINCT cp.teamId) FROM CompetitionParticipant cp WHERE cp.competition.id = c.id) END " +
            "FROM Competition c " +
            "WHERE c.id = :competitionId")
    Integer countTeamsOrUsersByCompetitionId(@Param("competitionId")UUID competitionId);

    Optional<CompetitionParticipant> findCompetitionParticipantByTeamIdAndCompetitionId(UUID id, UUID competitionId);

    Optional<CompetitionParticipant> findCompetitionParticipantByPlayerIdAndCompetitionId(Long id, UUID competitionId);

    List<CompetitionParticipant> findAllByCompetitionId(UUID competitionId);

    @Query("SELECT cp FROM CompetitionParticipant cp " +
            "WHERE cp.competition.id = :competitionId " +
            "AND (:isIndividual = TRUE AND cp.playerId IS NOT NULL " +
            "OR :isIndividual = FALSE AND cp.teamId IS NOT NULL)")
    List<CompetitionParticipant> findParticipantsByCompetitionId(
            @Param("competitionId") UUID competitionId,
            @Param("isIndividual") boolean isIndividual);

}
