package org.league.app.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class TournamentStageCreateEditDto {

    private UUID competitionId;
    private String stageName;
    private Integer stageOrder;
    private Boolean isElimination;
}
