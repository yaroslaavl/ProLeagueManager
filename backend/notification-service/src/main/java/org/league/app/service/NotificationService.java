package org.league.app.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Notification;
import org.league.app.database.entity.UserNotificationSubscription;
import org.league.app.database.entity.enums.EventCategory;
import org.league.app.database.entity.enums.EventType;
import org.league.app.database.repository.NotificationRepository;
import org.league.app.database.repository.UserNotificationSubscriptionRepository;
import org.league.app.dto.NotificationCreateDto;
import org.league.app.dto.NotificationReadDto;
import org.league.app.dto.UserNotificationSubscriptionReadDto;
import org.league.app.exception.TeamNotFoundException;
import org.league.app.exception.UserNotFoundException;
import org.league.app.feign.authClient.AuthClientFeign;
import org.league.app.feign.authClient.UserDto;
import org.league.app.feign.teamClient.TeamClientFeign;
import org.league.app.feign.teamClient.TeamFeignDto;
import org.league.app.mapper.NotificationMapper;
import org.league.app.mapper.UserNotificationSubscriptionMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final AuthClientFeign authClientFeign;
    private final NotificationMapper notificationMapper;
    private final NotificationRepository notificationRepository;
    private final UserNotificationSubscriptionMapper userNotificationSubscriptionMapper;
    private final UserNotificationSubscriptionRepository userNotificationSubscriptionRepository;
    private final TeamClientFeign teamClientFeign;

    @Transactional
    public boolean subscribeManagement(String eventCategory, Boolean isActive) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());
        List<UserNotificationSubscription> userNotificationSubscriptionByUserId =
                userNotificationSubscriptionRepository.findUserNotificationSubscriptionByUserId(userByEmail.getId());

        EventCategory targetCategory;
        try {
            targetCategory = EventCategory.valueOf(eventCategory);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid event category: " + eventCategory);
        }

        for (UserNotificationSubscription userNotificationSubscription : userNotificationSubscriptionByUserId) {
            if (userNotificationSubscription.getEventCategory() == targetCategory) {
                if (isActive) {
                    userNotificationSubscription.setIsActive(Boolean.TRUE);
                    userNotificationSubscriptionRepository.saveAndFlush(userNotificationSubscription);
                } else {
                    userNotificationSubscription.setIsActive(Boolean.FALSE);
                    userNotificationSubscriptionRepository.saveAndFlush(userNotificationSubscription);
                }
                return true;
            }
        }

        try {
            UserNotificationSubscription newSubscription = UserNotificationSubscription.builder()
                    .userId(userByEmail.getId())
                    .eventCategory(EventCategory.valueOf(eventCategory.trim().toUpperCase()))
                    .isActive(isActive)
                    .build();

            userNotificationSubscriptionRepository.save(newSubscription);
            return true;
        } catch (IllegalArgumentException e) {
            log.info("Failed to subscribe to notification: {}", e.getMessage());
            return false;
        }
    }

    public List<UserNotificationSubscriptionReadDto> getAllSubscriptions() {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());
        List<UserNotificationSubscription> userNotificationSubscriptionByUserId =
                userNotificationSubscriptionRepository.findAllByUserId(userByEmail.getId());

        return userNotificationSubscriptionByUserId.stream()
                .map(userNotificationSubscriptionMapper::toDto)
                .toList();
    }

    @Transactional
    public NotificationReadDto createNotification(NotificationCreateDto notificationCreateDto, String notificationType) {

        Notification notification = Optional.of(notificationCreateDto)
                .map(dto -> {
                    Notification entity = notificationMapper.toEntity(notificationCreateDto);
                    entity.setUserId(notificationCreateDto.getUserId());
                    entity.setTargetUserId(notificationCreateDto.getTargetUserId());
                    entity.setTeamId(notificationCreateDto.getTeamId());
                    entity.setMessage(notificationCreateDto.getMessage());
                    entity.setEventType(notificationCreateDto.getEventType());
                    entity.setIsRead(Boolean.FALSE);
                    entity.setCreatedAt(LocalDateTime.now());
                    return entity;
                }).orElseThrow(() -> new IllegalArgumentException("Bad mapping"));

        notificationRepository.save(notification);
        return notificationMapper.toDto(notification);
    }

    @Transactional
    public List<Notification> getAllNotifications() {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        if (userByEmail == null) {
            throw new UserNotFoundException("User not found");
        }

        List<EventType> excludedEventTypes = List.of(
                EventType.PLAYER_INVITED,
                EventType.PLAYER_JOINED,
                EventType.PLAYER_INVITATION_REJECTED,
                EventType.PLAYER_JOIN_REQUEST,
                EventType.PLAYER_JOIN_ACCEPTED
        );

        List<Notification> allByUserId = notificationRepository.findAllByUserIdExcludingEventTypes(
                userByEmail.getId(), excludedEventTypes);

        allByUserId.stream()
                .filter(notification -> !notification.getIsRead())
                .forEach(notification -> notification.setIsRead(Boolean.TRUE));

        notificationRepository.saveAll(allByUserId);

        return allByUserId;
    }


    @Transactional
    public List<Notification> getAllNotificationsForTeam(UUID teamId) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        if (userByEmail == null) {
            throw new UserNotFoundException("User not found");
        }

        TeamFeignDto teamById = teamClientFeign.findTeamById(teamId);
        if (teamById == null) {
            throw new TeamNotFoundException("Team not found: " + teamId);
        }

        boolean isManager = teamById.getTeamMembers().stream()
                .anyMatch(member -> member.getUserId().equals(userByEmail.getId()));

        if (!isManager) {
            return Collections.emptyList();
        }

        List<EventType> excludedEventTypes = List.of(
                EventType.TEAM_INVITATION,
                EventType.TEAM_JOINED,
                EventType.TEAM_INVITATION_REJECTED,
                EventType.TEAM_JOIN_REQUEST_REVOKED,
                EventType.TEAM_JOIN_REQUEST,
                EventType.TEAM_JOIN_ACCEPTED,
                EventType.TEAM_JOIN_DENIED
        );

        List<Notification> allByTeamId = notificationRepository.findAllByTeamId(teamById.getId(), excludedEventTypes);
        allByTeamId.stream()
                .filter(notification -> !notification.getIsRead())
                .forEach(notification -> notification.setIsRead(Boolean.TRUE));

        notificationRepository.saveAll(allByTeamId);

        return allByTeamId.stream()
                .toList();
    }

    @Transactional
    public void deleteTeamNotifications(Long userId, UUID teamId) {
        int deletedInvited = notificationRepository.deletePlayerInvitedByTargetUserIdAndTeamId(userId, teamId);
        int deletedInvitation = notificationRepository.deleteTeamInvitationByUserId(userId, teamId);

        log.info("Deleted {} PLAYER_INVITED and {} TEAM_INVITATION notifications for user {}",
                deletedInvited, deletedInvitation, userId);
    }

    @Transactional
    public void deleteUserTeamJoinRequest(Long userId, UUID teamId, List<String> eventTypes) {
        List<EventType> eventTypesList = eventTypes.stream()
                .map(EventType::valueOf)
                .collect(Collectors.toList());

        notificationRepository.deletePlayerJoinRequestByUserIdAndTeamId(userId, teamId, eventTypesList);

        log.info("Deleted join request {} and {} notifications for user {}",
                eventTypesList.getFirst(), eventTypesList.getLast(), userId);
    }


    public List<Notification> findAllTeamInvitations(EventType eventType) {
        return notificationRepository.findAllByEventTypeAndTargetUserIdNotNull(eventType);
    }

    private String getTokenFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return request.getHeader("Authorization");
        }
        return null;
    }

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto) {
            UserDto userDto = (UserDto) authentication.getPrincipal();
            return userDto.getEmail();
        }
        return authentication.getName();
    }
}
