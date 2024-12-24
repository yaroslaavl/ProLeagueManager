package org.league.app.feign;

import lombok.Data;

import java.util.List;

@Data
public class UserDto {
    
    private String email;
    private List<String> roles;
}