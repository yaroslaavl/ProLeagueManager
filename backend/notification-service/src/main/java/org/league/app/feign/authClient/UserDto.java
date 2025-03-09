package org.league.app.feign.authClient;

import lombok.Data;

import java.util.List;

@Data
public class UserDto {

    private Long id;
    private String email;
    private List<String> roles;
}
