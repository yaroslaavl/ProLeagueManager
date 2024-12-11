package org.league.app.dto;

import lombok.Data;
import lombok.Value;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Value
public class UserPublicProfileDto {

    Long id;
    String username;
    String firstName;
    String lastName;
    @DateTimeFormat(pattern = "yyyy-MM-dd")
    LocalDate birthDate;
    String avatar;
    LocalDateTime createdAt;
}
