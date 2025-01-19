package org.league.app.feign.teamClietnt;

import lombok.Data;
import org.league.app.database.entity.enums.TeamStatus;

import java.util.List;
import java.util.UUID;

@Data
public class TeamFeignDto {

    private UUID id;
    private String teamName;
    private TeamStatus teamStatus;
    private List<TeamMemberFeignDto> teamMembers;
}
