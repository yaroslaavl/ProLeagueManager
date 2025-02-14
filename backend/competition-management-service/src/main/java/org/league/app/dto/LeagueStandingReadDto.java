package org.league.app.dto;

import lombok.Value;

import java.util.UUID;

@Value
public class LeagueStandingReadDto {

    UUID id;
    UUID competitionId;
    UUID teamId;
    Long playerId;
    Integer wins;
    Integer losses;
    Integer draws;
    Integer points;
}
