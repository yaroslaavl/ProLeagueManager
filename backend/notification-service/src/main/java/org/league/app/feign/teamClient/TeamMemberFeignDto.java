package org.league.app.feign.teamClient;

import lombok.Data;

import java.util.List;

@Data
public class TeamMemberFeignDto {

    private Long id;
    private List<TeamRoleFeignDto> roles;
    private Long userId;
}