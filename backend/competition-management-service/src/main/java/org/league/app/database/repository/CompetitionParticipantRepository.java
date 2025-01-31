package org.league.app.database.repository;

import org.league.app.database.entity.CompetitionParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CompetitionParticipantRepository extends JpaRepository<CompetitionParticipant, UUID> {

    Optional<CompetitionParticipant> findCompetitionParticipantByTeamIdAndCompetitionId(UUID id, UUID competitionId);

    Optional<CompetitionParticipant> findCompetitionParticipantByPlayerIdAndCompetitionId(Long id, UUID competitionId);
}
