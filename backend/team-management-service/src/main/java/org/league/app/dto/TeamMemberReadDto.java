package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.enums.TeamRole;

import java.time.LocalDateTime;

@Value
public class TeamMemberReadDto {

    Long id;

    Team team;

    Long userId;

    TeamRole teamRole;

    Boolean isSubstitute;

    LocalDateTime joinedAt;
}
