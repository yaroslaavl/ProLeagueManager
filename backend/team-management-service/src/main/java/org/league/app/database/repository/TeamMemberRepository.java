package org.league.app.database.repository;

import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.TeamRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

   Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, Long userId);

   @Query("SELECT tm FROM TeamMember tm " +
           "JOIN FETCH tm.team t " +
           "LEFT JOIN FETCH t.teamMemberList " +
           "WHERE tm.userId = :userId")
   List<TeamMember> findTeamsByUserId(@Param("userId") Long userId);

   List<TeamMember> findTeamMemberByTeamId(UUID teamId);

   List<TeamMember> findTeamMemberByRolesAndTeamId(List<TeamRole> roles, UUID teamId);

   List<TeamMember> findTeamMemberByRolesAndUserId(List<TeamRole> roles, Long userId);
}
