package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentStageDto {

    UUID id;
    UUID competitionId;
    String stageName;
    Integer stageOrder;
    Boolean isElimination;
    LocalDateTime createdAt;
}