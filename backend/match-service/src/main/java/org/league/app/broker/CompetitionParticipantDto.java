package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionParticipantDto {

    UUID id;
    UUID competitionId;
    UUID teamId;
    Long playerId;
    LocalDateTime registeredAt;
    String competitionParticipantStatus;
    LocalDateTime createdAt;
}
