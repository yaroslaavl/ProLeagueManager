package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.enums.EventCategory;

import java.time.LocalDateTime;

@Value
public class UserNotificationSubscriptionReadDto {

    Long id;
    Long userId;
    EventCategory eventCategory;
    Boolean isActive;
    LocalDateTime createdAt;
}
