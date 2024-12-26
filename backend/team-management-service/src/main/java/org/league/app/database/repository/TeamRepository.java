package org.league.app.database.repository;

import org.league.app.database.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID> {

    Team findTeamByTeamName(@Param("teamName") String teamName);

    Optional<Team> findTeamById(UUID id);
}
