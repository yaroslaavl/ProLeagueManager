package org.league.app.dto;

import lombok.Data;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.enums.TeamRole;

@Data
public class TeamMemberCreateDto {

    Team team;

    Integer userId;

    TeamRole teamRole;

    Boolean isSubstitute;
}
