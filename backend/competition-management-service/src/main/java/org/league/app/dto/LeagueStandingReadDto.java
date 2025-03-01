package org.league.app.dto;

import lombok.*;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor(force = true)
public class LeagueStandingReadDto {
    private UUID id;
    private UUID competitionId;
    private UUID teamId;
    private Long playerId;
    private Integer wins;
    private Integer losses;
    private Integer draws;
    private Integer points;
}
