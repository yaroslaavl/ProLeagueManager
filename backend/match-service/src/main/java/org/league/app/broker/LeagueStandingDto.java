package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
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
