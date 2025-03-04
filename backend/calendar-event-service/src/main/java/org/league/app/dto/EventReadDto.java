package org.league.app.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class EventReadDto {

    UUID id;
    String title;
    UUID matchId;
    UUID competitionId;
    String eventType;
    String status;
    Boolean isPinned;
    LocalDateTime createdAt;
}