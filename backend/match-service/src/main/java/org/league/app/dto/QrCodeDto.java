package org.league.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class QrCodeDto {

    private UUID matchId;
    private UUID teamId;
    private List<Long> startingPlayers;
    private String matchDate;
    private String timestamp;
}
