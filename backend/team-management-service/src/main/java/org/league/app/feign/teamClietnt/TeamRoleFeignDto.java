package org.league.app.feign.teamClietnt;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TeamRoleFeignDto {

    private Integer id;
    private String roleName;
}
