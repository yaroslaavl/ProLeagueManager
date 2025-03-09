package org.league.app.dto;

import lombok.Data;
import org.league.app.database.entity.enums.EventType;

import java.util.UUID;

@Data
public class NotificationCreateDto {

    private Long userId;
    private Long targetUserId;
    private UUID teamId;
    private String message;
    private EventType eventType;
    private Boolean isRead;

}

