package org.league.app.dto;

import lombok.Data;
import org.league.app.database.entity.enums.EventCategory;

@Data
public class UserNotificationSubscriptionCreateEditDto {

    private Long userId;
    private EventCategory eventCategory;
    private Boolean isActive;
}
