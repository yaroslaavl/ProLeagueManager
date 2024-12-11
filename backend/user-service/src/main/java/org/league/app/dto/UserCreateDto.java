package org.league.app.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import org.league.app.database.entity.RoleGroup;
import org.league.app.validation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateDto {

    Long id;

    @NotEmpty(groups = CreateAction.class)
    @Size(min = 4, max = 12, message = "User has incorrect username size. Size should be between 4 and 12 letters", groups = CreateAction.class)
    @Pattern(regexp = "^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$", message = "User has incorrect username pattern", groups = CreateAction.class)
    String username;

    @EmailСustom(message = "User has incorrect email pattern", groups = CreateAction.class)
    String email;

    @NotEmpty(groups = CreateAction.class)
    @Size(min = 8, max = 20, message = "User has incorrect password size. Size should be between 8 and 20 letters", groups = CreateAction.class)
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$", message = "User has incorrect password pattern", groups = CreateAction.class)
    String password;

    @NotEmpty(groups = CreateAction.class)
    @Size(min = 2, max = 14, message = "User has incorrect first name size. Size should be between 2 and 14 letters", groups = CreateAction.class)
    @Pattern(regexp = "^[A-Za-z]+$", message = "User has incorrect first name pattern", groups = CreateAction.class)
    String firstName;

    @NotEmpty(groups = CreateAction.class)
    @Size(min = 2, max = 14, message = "User has incorrect last name size. Size should be between 2 and 14 letters", groups = CreateAction.class)
    @Pattern(regexp = "^[A-Za-z]+$",  message = "User has incorrect last name pattern", groups = CreateAction.class)
    String lastName;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @AgeLimit(minAge = 5, minYear = 1924, message = "User has incorrect birth day", groups = {CreateAction.class, EditAction.class})
    LocalDate birthDate;

    RoleGroup roleGroup;

    Boolean isVerified;

    String emailVerificationToken;

}
