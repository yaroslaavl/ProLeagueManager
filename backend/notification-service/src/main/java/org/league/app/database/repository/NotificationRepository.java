package org.league.app.database.repository;

import org.league.app.database.entity.Notification;
import org.league.app.database.entity.enums.EventType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findAllByUserIdAndTeamIdNull(Long userId);

    @Query("SELECT n FROM Notification n WHERE n.teamId = :teamId ORDER BY n.createdAt DESC")
    List<Notification> findAllByTeamId(@Param("teamId") UUID teamId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.userId = :userId AND n.eventType = 'TEAM_INVITATION'")
    int deleteTeamInvitationByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Notification n WHERE n.targetUserId = :userId AND n.teamId = :teamId AND n.eventType = 'PLAYER_INVITED'")
    int deletePlayerInvitedByTargetUserIdAndTeamId(@Param("userId") Long userId, @Param("teamId") UUID teamId);

    List<Notification> findAllByEventTypeAndTargetUserIdNotNull(EventType eventType);
}
