package org.league.app.database.repository;

import org.league.app.database.entity.RoleGroup;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleGroupRepository extends JpaRepository<RoleGroup, Integer> {

    Optional<RoleGroup> findByName(String name);
}
