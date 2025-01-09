package org.league.app.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class CompetitionStageReadDto {

    UUID id;
    UUID competitionId;
    String stageName;
    Boolean isElimination;
    LocalDateTime createdAt;
}
