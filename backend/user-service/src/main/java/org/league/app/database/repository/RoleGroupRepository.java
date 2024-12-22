package org.league.app.database.repository;

import org.league.app.database.entity.RoleGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleGroupRepository extends JpaRepository<RoleGroup, Integer> {

    Optional<RoleGroup> findByName(String name);

    @Query("SELECT u.roleGroup FROM User u WHERE u.email = :email")
    RoleGroup findRoleGroupByEmailWithRoles(@Param("email") String email);

}
