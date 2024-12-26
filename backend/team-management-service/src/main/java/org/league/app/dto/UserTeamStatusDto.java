package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.enums.TeamRole;

@Value
public class UserTeamStatusDto {

    Boolean isMember;
    TeamRole userTeamRole;
}
