package org.league.app.database.repository;

import org.league.app.database.entity.CompetitionParticipant;
import org.league.app.database.entity.enums.CompetitionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;
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

    List<CompetitionParticipant> findCompetitionParticipantByTeamIdAndCompetitionId(UUID id, UUID competitionId);

    Optional<CompetitionParticipant> findCompetitionParticipantByPlayerIdAndCompetitionId(Long id, UUID competitionId);

    List<CompetitionParticipant> findAllByCompetitionId(UUID competitionId);

    @Query("SELECT cp.playerId FROM CompetitionParticipant cp " +
            "WHERE cp.competition.id = :competitionId " +
            "AND cp.teamId = :teamId")
    Set<Long> findParticipantsByCompetitionIdAndTeamId(
            @Param("competitionId") UUID competitionId,
            @Param("teamId") UUID teamId);

    @Query("SELECT cp.playerId FROM CompetitionParticipant cp " +
            "WHERE cp.competition.id = :competitionId")
    Set<Long> findParticipantsByCompetitionId(@Param("competitionId") UUID competitionId);

    @Query("SELECT cp.competition.id FROM CompetitionParticipant cp WHERE cp.playerId = :playerId AND cp.competition.competitionType = :competitionType AND (cp.competition.status = 'ACTIVE' OR cp.competition.status = 'COMPLETED')")
    List<UUID> findCompetitionIdByCompetitionParticipantPlayerId(@Param("playerId") Long playerId, @Param("competitionType") CompetitionType competitionType);

    @Query("SELECT cp.teamId FROM CompetitionParticipant cp WHERE cp.playerId = :userId")
    UUID findTeamByUserId(@Param("userId") Long userId);
}
