package org.league.app.database.repository;

import org.league.app.database.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamRepository extends JpaRepository<Team, UUID>, JpaSpecificationExecutor<Team> {

    Optional<Team> findTeamByTeamName(String teamName);

    @Query("SELECT t FROM Team t JOIN FETCH t.teamMemberList WHERE t.id = :id")
    Optional<Team> findTeamById(@Param("id") UUID id);
}
