package org.league.app.dto;

import lombok.Data;
import lombok.Value;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.enums.TeamRole;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TeamMemberCreateDto {

    private UUID teamId;

    private Long userId;

    private TeamRole teamRole;

    private Boolean isSubstitute;

    private LocalDateTime joinedAt;
}
