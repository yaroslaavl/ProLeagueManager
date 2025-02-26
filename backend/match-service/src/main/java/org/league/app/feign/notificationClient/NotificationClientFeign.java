package org.league.app.feign.notificationClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient("notification-service")
public interface NotificationClientFeign {

    @PostMapping("/api/my-notifications/send-notification")
    NotificationDto sendNotification(@RequestBody NotificationDto notification, @RequestParam("notificationCategory") String notificationCategory);

    @PostMapping("/api/notification/send-email-with-qr-code")
    String sendMailWithQrCode(@RequestBody EmailRequestWithQrCode emailRequestWithQrCode);
}