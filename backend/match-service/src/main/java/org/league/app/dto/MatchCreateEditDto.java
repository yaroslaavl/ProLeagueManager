package org.league.app.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.league.app.database.entity.enums.MatchStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class MatchCreateEditDto {

    private UUID competitionId;
    private UUID stageId;
    private UUID teamAId;
    private UUID teamBId;
    private Long playerAId;
    private Long playerBId;
    private LocalDateTime matchDate;
    private MatchStatus matchStatus;
    private Integer scoreA;
    private Integer scoreB;
    private Boolean isOvertime;
    private Boolean isDraw;
    private UUID winnerTeamId;
    private Long winnerPlayerId;
    private Integer leagueTourNumber;
    @JsonProperty("aConfirmed")
    private Boolean aConfirmed;
    @JsonProperty("bConfirmed")
    private Boolean bConfirmed;
    private UUID nextMatchId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}