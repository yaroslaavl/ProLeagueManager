package org.league.app.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CompetitionStageCreateEditDto {

    private UUID competitionId;
    private String stageName;
    private Boolean isElimination;
}
