package org.league.app.database.repository;

import org.league.app.database.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

   Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, Long userId);

   Optional<TeamMember> findTeamByUserId(Long userId);

   List<TeamMember> findTeamMemberByTeamId(UUID teamId);
}
