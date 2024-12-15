package org.league.app.feign;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserDto {

    private String email;
    private String username;
    private List<String> roles;
}