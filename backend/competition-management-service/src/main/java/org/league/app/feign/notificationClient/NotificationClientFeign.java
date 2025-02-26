package org.league.app.feign.notificationClient;

import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

import java.time.LocalDateTime;

@FeignClient("notification-service")
public interface NotificationClientFeign {

    @Retry(name = "notificationServiceRetry", fallbackMethod = "fallbackNotification")
    @PostMapping("/api/my-notifications/send-notification")
    NotificationDto sendNotification(@RequestBody NotificationDto notification, @RequestParam("notificationCategory") String notificationCategory);

    default NotificationDto fallbackNotification(NotificationDto notification,
                                                 String notificationCategory,
                                                 Throwable t) {
        Logger logger = LoggerFactory.getLogger(NotificationClientFeign.class);
        logger.warn("Notification service is down. Cannot send notification of category '{}'. Error: {}",
                notificationCategory, t.getMessage());

        return new NotificationDto(null, null, null, null, null, LocalDateTime.now());
    }
}