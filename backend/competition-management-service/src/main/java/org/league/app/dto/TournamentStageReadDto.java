package org.league.app.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class TournamentStageReadDto {

    UUID id;
    UUID competitionId;
    String stageName;
    Integer stageOrder;
    Boolean isElimination;
    LocalDateTime createdAt;
}
