package org.league.app.dto;

import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class CompetitionParticipantCreateEditDto {

    private UUID competitionId;
    private UUID teamId;
    private Long playerId;
    private Boolean isTeam;
    private Integer points;
    private OffsetDateTime registeredAt;
    private String status;
}
