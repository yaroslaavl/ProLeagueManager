package org.league.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.league.app.database.entity.enums.EventType;
import org.league.app.database.entity.enums.Status;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class EventCreateEditDto {

    private String title;
    private UUID matchId;
    private UUID competitionId;
    private EventType eventType;
    private Status status;
    private Boolean isPinned;
    private LocalDateTime createdAt;
}
