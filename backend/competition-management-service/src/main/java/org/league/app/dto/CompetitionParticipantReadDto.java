package org.league.app.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Value
public class CompetitionParticipantReadDto {

    UUID id;
    UUID competitionId;
    UUID teamId;
    Long playerId;
    LocalDateTime registeredAt;
    String competitionParticipantStatus;
    LocalDateTime createdAt;
}
