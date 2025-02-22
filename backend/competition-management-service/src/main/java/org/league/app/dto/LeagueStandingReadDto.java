package org.league.app.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Value;

import java.util.UUID;

@Value
@AllArgsConstructor
@NoArgsConstructor(force = true)
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
