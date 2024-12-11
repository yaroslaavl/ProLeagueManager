package org.league.app.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.league.app.validation.AgeLimit;
import org.league.app.validation.EditAction;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;

@Data
public class UserPersonalDataDto {

    @Size(min = 4, max = 12, message = "User has incorrect username size. Size should be between 4 and 12 letters", groups = EditAction.class)
    @Pattern(regexp = "^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*$", message = "User has incorrect username pattern", groups = EditAction.class)
    private String username;

    @Size(min = 2, max = 14, message = "User has incorrect first name size. Size should be between 2 and 14 letters", groups = EditAction.class)
    @Pattern(regexp = "^[A-Za-z]+$", message = "User has incorrect first name pattern", groups = EditAction.class)
    private String firstName;

    @Size(min = 2, max = 14, message = "User has incorrect last name size. Size should be between 2 and 14 letters", groups = EditAction.class)
    @Pattern(regexp = "^[A-Za-z]+$", message = "User has incorrect last name pattern", groups = EditAction.class)
    private String lastName;

    @DateTimeFormat(pattern = "yyyy-MM-dd")
    @AgeLimit(minAge = 5, minYear = 1924, message = "User has incorrect birth day", groups = EditAction.class)
    private LocalDate birthDate;
}
