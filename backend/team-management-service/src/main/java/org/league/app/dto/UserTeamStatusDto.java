package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.TeamRole;

import java.util.List;

@Value
public class UserTeamStatusDto {

    Boolean isMember;
    List<TeamRole> roles;
}
