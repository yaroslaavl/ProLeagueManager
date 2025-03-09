package org.league.app.feign.notificationClient;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDto {

    private UUID id;
    private Long userId;
    private Long targetUserId;
    private UUID teamId;
    private String message;
    private String eventType;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
