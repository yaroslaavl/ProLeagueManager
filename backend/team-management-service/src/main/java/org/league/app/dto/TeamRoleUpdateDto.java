package org.league.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TeamRoleUpdateDto {

    private List<String> addedRoles;
    private List<String> removedRoles;
}
