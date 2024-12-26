package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.UserNotificationSubscriptionReadDto;
import org.league.app.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my-notifications")
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/subscribe")
    public ResponseEntity<Boolean> subscribeManagement(@RequestParam("eventCategory") String eventCategory,
                                                           @RequestParam("isActive") Boolean isActive) {
        boolean isSubscribed = notificationService.subscribeManagement(eventCategory, isActive);
        return ResponseEntity.ok(isSubscribed);
    }

    @GetMapping("/subscriptionList")
    public List<UserNotificationSubscriptionReadDto> getSubscriptionList() {
        return notificationService.getAllSubscriptions();
    }

}
