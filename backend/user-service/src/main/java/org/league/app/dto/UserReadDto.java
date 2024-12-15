package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.RoleGroup;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Value
public class UserReadDto {

   Long id;
   String username;
   String email;
   String firstName;
   String lastName;
   @DateTimeFormat(pattern = "yyyy-MM-dd")
   LocalDate birthDate;
   RoleGroup roleGroup;
   Boolean isVerified;
   String avatar;
   LocalDateTime createdAt;

}
