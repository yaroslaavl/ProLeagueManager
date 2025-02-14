package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.Value;

import java.util.UUID;

@Value
public class LeagueStandingDto {

    UUID id;
    UUID competitionId;
    UUID teamId;
    Long playerId;
    Integer wins;
    Integer losses;
    Integer draws;
    Integer points;
}
