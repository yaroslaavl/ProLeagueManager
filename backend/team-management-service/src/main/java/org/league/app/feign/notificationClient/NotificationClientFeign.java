package org.league.app.feign.notificationClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@FeignClient("notification-service")
public interface NotificationClientFeign {

    @Retry(name = "notificationServiceRetry", fallbackMethod = "fallbackNotification")
    @PostMapping("/api/my-notifications/send-notification")
    NotificationDto sendNotification(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody NotificationDto notification,
            @RequestParam("notificationCategory") String notificationCategory);

    default NotificationDto fallbackNotification(String authorizationHeader,
                                                 NotificationDto notification,
                                                 String notificationCategory,
                                                 Throwable t) {
        Logger logger = LoggerFactory.getLogger(NotificationClientFeign.class);
        logger.warn("Notification service is down. Cannot send notification of category '{}'. Error: {}",
                notificationCategory, t.getMessage());

        return new NotificationDto(null,null,null, null, null, null, null, LocalDateTime.now());
    }

    @DeleteMapping("/api/my-notifications/team/{teamId}/{userId}")
    void deleteTeamNotifications(@RequestHeader("Authorization") String token,
                                 @PathVariable("teamId") UUID teamId,
                                 @PathVariable("userId") Long userId);
}
