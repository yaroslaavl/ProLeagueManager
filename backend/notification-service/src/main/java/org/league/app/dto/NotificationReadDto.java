package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.enums.EventType;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class NotificationReadDto {

    UUID id;
    Long userId;
    Long targetUserId;
    UUID teamId;
    String message;
    EventType eventType;
    Boolean isRead;
    LocalDateTime createdAt;
}
