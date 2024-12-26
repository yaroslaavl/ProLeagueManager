package org.league.app.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.league.app.validation.EditAction;

@Data
public class ResetPasswordDto {

    @NotEmpty(groups = EditAction.class)
    @Size(min = 8, max = 20, message = "User has incorrect password size. Size should be between 8 and 20 letters", groups = EditAction.class)
    @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*(),.?\":{}|<>]).{8,}$", message = "User has incorrect password pattern", groups = EditAction.class)
    private String newPassword;
}