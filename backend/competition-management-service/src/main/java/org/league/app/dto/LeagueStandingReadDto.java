package org.league.app.dto;

import lombok.*;

import java.util.UUID;

@Data
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
