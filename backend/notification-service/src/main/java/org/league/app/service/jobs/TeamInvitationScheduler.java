package org.league.app.service.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Notification;
import org.league.app.database.repository.NotificationRepository;
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
    public void cleanExpiredNotifications() {
        log.info("Cleaning expired notifications if exists");
        List<Notification> allNotifications = notificationService.findAllTeamInvitations();
        List<UUID> deletedNotificationIds = new ArrayList<>();

        for (Notification notification : allNotifications) {
            String redisKey = "User:" + notification.getTargetUserId() + "teamInvitation";
            String token = authClient.getToken(redisKey);

            if (token == null || token.isEmpty()) {
                deletedNotificationIds.add(notification.getId());
                log.info("Deleting expired notification: {} for user {} in team {}",
                        notification.getEventType(), notification.getTargetUserId(), notification.getTeamId());
            }
        }

        if (!deletedNotificationIds.isEmpty()) {
            notificationRepository.deleteAllById(deletedNotificationIds);
            log.info("Deleted {} expired notifications", deletedNotificationIds.size());
        } else {
            log.info("No expired notifications found.");
        }
    }

}
