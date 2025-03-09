package org.league.app.feign.teamClient;

import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class TeamFeignDto {

    private UUID id;
    private String teamName;
    private String teamStatus;
    private List<TeamMemberFeignDto> teamMembers;
}
