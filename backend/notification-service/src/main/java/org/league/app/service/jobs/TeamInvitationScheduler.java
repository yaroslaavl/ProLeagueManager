package org.league.app.service.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Notification;
import org.league.app.database.entity.enums.EventType;
import org.league.app.database.repository.NotificationRepository;
import org.league.app.exception.NotificationNotFoundException;
import org.league.app.feign.authClient.AuthClientFeign;
import org.league.app.service.NotificationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TeamInvitationScheduler {

    private final NotificationService notificationService;
    private final AuthClientFeign authClient;
    private final NotificationRepository notificationRepository;

    @Scheduled(fixedDelay = 60000)
    public void cleanExpiredTeamInvitations() {
        log.info("Cleaning expired notifications if exists");
        List<Notification> allNotifications = notificationService.findAllTeamInvitations(EventType.PLAYER_INVITED);
        List<UUID> userNotifications = new ArrayList<>();
        List<UUID> deletedNotificationIds = new ArrayList<>();

        for (Notification notification : allNotifications) {
            String invitationKey = "User:" + notification.getTargetUserId() + "teamInvitationId:" + notification.getTeamId();
            String invitationToken = authClient.getToken(invitationKey);

            if (invitationToken == null || invitationToken.isEmpty()) {
                deletedNotificationIds.add(notification.getId());
                userNotifications.add(notificationRepository.findIdByEventTypeAndUserId(
                                EventType.TEAM_INVITATION, notification.getTargetUserId(), notification.getTeamId())
                        .orElseThrow(() -> new NotificationNotFoundException("Notification not found")));
                log.info("Deleting expired notification: {} for user {} in team {}",
                        notification.getEventType(), notification.getTargetUserId(), notification.getTeamId());
            }
        }

        if (!deletedNotificationIds.isEmpty()) {
            notificationRepository.deleteAllById(deletedNotificationIds);
            notificationRepository.deleteAllById(userNotifications);
            log.info("Deleted {} expired notifications by managers", deletedNotificationIds.size());
            log.info("Deleted {} expired team user invitations", userNotifications.size());
        } else {
            log.info("No expired notifications found.");
        }
    }

    @Scheduled(fixedDelay = 60000)
    public void cleanExpiredTeamJoinRequests() {
        log.info("Cleaning expired team join notifications if exists");
        List<Notification> allNotifications = notificationService.findAllTeamInvitations(EventType.PLAYER_JOIN_REQUEST);
        List<UUID> userNotifications = new ArrayList<>();
        List<UUID> deletedNotificationIds = new ArrayList<>();

        for (Notification notification : allNotifications) {
            String requestKey = "User:" + notification.getUserId() + "requestToJoinTeamId:" + notification.getTeamId();
            String requestToken = authClient.getToken(requestKey);

            if (requestToken == null || requestToken.isEmpty()) {
                deletedNotificationIds.add(notification.getId());
                userNotifications.add(notificationRepository.findIdByEventTypeAndUserId(
                                EventType.TEAM_JOIN_REQUEST, notification.getUserId(), notification.getTeamId())
                        .orElseThrow(() -> new NotificationNotFoundException("Notification not found")));
                log.info("Deleting expired team join notification: {} for user {} in team {}",
                        notification.getEventType(), notification.getTargetUserId(), notification.getTeamId());
            }
        }

        if (!deletedNotificationIds.isEmpty()) {
            notificationRepository.deleteAllById(deletedNotificationIds);
            notificationRepository.deleteAllById(userNotifications);
            log.info("Deleted {} expired team join notifications to team managers", deletedNotificationIds.size());
            log.info("Deleted {} expired team user join request", userNotifications.size());
        } else {
            log.info("No expired team join notifications found.");
        }
    }
}
