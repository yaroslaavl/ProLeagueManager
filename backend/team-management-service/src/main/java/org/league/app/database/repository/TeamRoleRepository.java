package org.league.app.database.repository;

import org.league.app.database.entity.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRoleRepository extends JpaRepository<TeamRole, Integer> {

    Optional<TeamRole> findByName(String name);
}
