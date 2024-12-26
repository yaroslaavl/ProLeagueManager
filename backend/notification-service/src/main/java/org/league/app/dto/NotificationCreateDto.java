package org.league.app.dto;

import lombok.Data;
import org.league.app.database.entity.enums.EventType;

@Data
public class NotificationCreateDto {

    private Long userId;
    private String message;
    private EventType eventType;
    private Boolean isRead;

}

