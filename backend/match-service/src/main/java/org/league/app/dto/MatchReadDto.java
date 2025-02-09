package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.enums.MatchStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class MatchReadDto {

    UUID competitionId;
    UUID stageId;
    UUID teamAId;
    UUID teamBId;
    Long playerAId;
    Long playerBId;
    LocalDateTime matchDate;
    MatchStatus matchStatus;
    Integer scoreA;
    Integer scoreB;
    Boolean isOvertime;
    Boolean isDraw;
    UUID winnerTeamId;
    Long winnerPlayerId;
    Integer leagueTourNumber;
    LocalDateTime createdAt;
}