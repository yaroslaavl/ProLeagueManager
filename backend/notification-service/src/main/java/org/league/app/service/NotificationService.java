package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.UserNotificationSubscription;
import org.league.app.database.entity.enums.EventCategory;
import org.league.app.database.repository.UserNotificationSubscriptionRepository;
import org.league.app.dto.UserNotificationSubscriptionReadDto;
import org.league.app.feign.AuthClientFeign;
import org.league.app.feign.UserDto;
import org.league.app.mapper.UserNotificationSubscriptionMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final AuthClientFeign authClientFeign;
    private final UserNotificationSubscriptionMapper userNotificationSubscriptionMapper;
    private final UserNotificationSubscriptionRepository userNotificationSubscriptionRepository;

    @Transactional
    public boolean subscribeManagement(String eventCategory, Boolean isActive) {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());
        Optional<UserNotificationSubscription> userNotificationSubscriptionByUserId =
                userNotificationSubscriptionRepository.findUserNotificationSubscriptionByUserId(userByEmail.getId());

        if (userNotificationSubscriptionByUserId.isPresent() && userNotificationSubscriptionByUserId.get().getEventCategory() == EventCategory.valueOf(eventCategory.trim().toUpperCase())) {
            UserNotificationSubscription subscription = userNotificationSubscriptionByUserId.get();
            if (isActive) {
                subscription.setIsActive(Boolean.TRUE);
                userNotificationSubscriptionRepository.save(subscription);
            } else {
                subscription.setIsActive(Boolean.FALSE);
                userNotificationSubscriptionRepository.save(subscription);
            }
            return true;
        }

        try {
            UserNotificationSubscription newSubscription = UserNotificationSubscription.builder()
                    .userId(userByEmail.getId())
                    .eventCategory(EventCategory.valueOf(eventCategory.trim().toUpperCase()))
                    .isActive(Boolean.TRUE)
                    .build();

            userNotificationSubscriptionRepository.save(newSubscription);
            return true;
        } catch (IllegalArgumentException e) {
            log.info("Failed to subscribe to notification: {}", e.getMessage());
            return false;
        }
    }

    public List<UserNotificationSubscriptionReadDto> getAllSubscriptions () {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());
        List<UserNotificationSubscription> userNotificationSubscriptionByUserId =
                userNotificationSubscriptionRepository.findAllByUserId(userByEmail.getId());

            return userNotificationSubscriptionByUserId.stream()
                    .map(userNotificationSubscriptionMapper::toDto)
                    .toList();
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
