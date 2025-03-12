package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Notification;
import org.league.app.database.entity.UserNotificationSubscription;
import org.league.app.database.entity.enums.EventCategory;
import org.league.app.database.repository.UserNotificationSubscriptionRepository;
import org.league.app.dto.NotificationCreateDto;
import org.league.app.dto.NotificationReadDto;
import org.league.app.dto.UserNotificationSubscriptionReadDto;
import org.league.app.mapper.NotificationMapper;
import org.league.app.service.NotificationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/my-notifications")
public class NotificationController {

    private final NotificationMapper notificationMapper;
    private final NotificationService notificationService;
    public Map<String, SseEmitter> sseEmitters = new ConcurrentHashMap<>();
    private final UserNotificationSubscriptionRepository userNotificationSubscriptionRepository;

    @PostMapping("/subscribeToNotification")
    public ResponseEntity<Boolean> subscribeManagement(@RequestParam("eventCategory") String eventCategory,
                                                       @RequestParam("isActive") Boolean isActive) {
        boolean isSubscribed = notificationService.subscribeManagement(eventCategory, isActive);
        return ResponseEntity.ok(isSubscribed);
    }

    @GetMapping("/subscriptionList")
    public List<UserNotificationSubscriptionReadDto> getSubscriptionList() {
        return notificationService.getAllSubscriptions();
    }

    @GetMapping(value = "/subscribe/{id}", consumes = MediaType.ALL_VALUE)
    public SseEmitter subscribe(@PathVariable("id") Long id) {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        try {
            sseEmitters.put(id.toString(), emitter);
            emitter.onCompletion(() -> sseEmitters.remove(id.toString()));
            emitter.onTimeout(() -> sseEmitters.remove(id.toString()));
            return emitter;
        } catch (Exception e) {
            log.error("Failed to subscribe to SSE: ", e);
            sseEmitters.remove(id.toString());
            throw e;
        }
    }

    @PostMapping("/send-notification")
    public ResponseEntity<NotificationReadDto> sendNotification(
            @RequestHeader("Authorization") String token,
            @RequestBody NotificationCreateDto notificationCreateDto,
            @RequestParam("notificationCategory") String notificationCategory) {
        NotificationReadDto notification = notificationService.createNotification(notificationCreateDto, notificationCategory);

        Optional<UserNotificationSubscription> userNotificationSubscriptionByEventCategoryAndUserId =
                userNotificationSubscriptionRepository.findUserNotificationSubscriptionByEventCategoryAndUserId(
                        EventCategory.valueOf(notificationCategory.trim().toUpperCase()),
                        notificationCreateDto.getUserId());

        if (userNotificationSubscriptionByEventCategoryAndUserId.isPresent() &&
                userNotificationSubscriptionByEventCategoryAndUserId.get().getIsActive()) {
            sendSseNotification(notificationCreateDto.getUserId(), notificationCreateDto.getMessage());
        }

        return ResponseEntity.ok(notification);
    }

    @PostMapping("/get-all-notifications")
    public List<NotificationReadDto> getAllNotifications() {
        List<Notification> allNotifications = notificationService.getAllNotifications();
        return allNotifications.stream()
                .map(notificationMapper::toDto)
                .toList();
    }

    @PostMapping("/get-team/{teamId}")
    public List<NotificationReadDto> getAllTeamNotificationsForManager(@PathVariable("teamId") UUID teamId) {
        List<Notification> allNotificationsForTeam = notificationService.getAllNotificationsForTeam(teamId);

        return allNotificationsForTeam.stream()
                .map(notificationMapper::toDto)
                .toList();
    }

    @DeleteMapping("/team/{teamId}/{userId}")
    public void deleteTeamNotifications(@RequestHeader("Authorization") String token,
                                        @PathVariable("teamId") UUID teamId,
                                        @PathVariable("userId") Long userId) {

        notificationService.deleteTeamNotifications(userId, teamId);
    }

    @DeleteMapping("/team-join-request/{teamId}/{userId}")
    public void deleteUserJoinRequest(@RequestHeader("Authorization") String token,
                                      @PathVariable("teamId") UUID teamId,
                                      @PathVariable("userId") Long userId,
                                      @RequestParam("eventTypes") List<String> eventTypes) {

        notificationService.deleteUserTeamJoinRequest(userId, teamId, eventTypes);
    }

    private void sendSseNotification(Long userId, String message) {
        SseEmitter emitter = sseEmitters.get(userId.toString());
        if (emitter != null) {
            try {
                log.info("Sse notification sent to user: {}", userId);
                emitter.send(SseEmitter.event().data(message));
            } catch (IOException e) {
                log.error("Failed to send SSE notification to user: {}", userId, e);
                sseEmitters.remove(userId.toString());
            }
        } else {
            log.warn("No emitter found for user: {}. Current emitters: {}", userId, sseEmitters.keySet());
        }
    }
}
