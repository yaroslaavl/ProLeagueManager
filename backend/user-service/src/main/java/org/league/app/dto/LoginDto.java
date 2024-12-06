package org.league.app.dto;

import lombok.Data;
import org.league.app.database.entity.RoleGroup;

@Data
public class LoginDto {

    private String username;
    private String password;
    private RoleGroup roleGroup;
}
