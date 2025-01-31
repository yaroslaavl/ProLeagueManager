package org.league.app.feign.teamClietnt;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TeamMemberFeignDto {

    private Long id;
    private List<TeamRoleFeignDto> roles;
    private Long userId;
    private Boolean isSubstitute;
}