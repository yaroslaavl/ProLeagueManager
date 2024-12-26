package org.league.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;

@Data
public class TeamCreateEditDto {

    @NotBlank(message = "Team name must not be blank", groups = {CreateAction.class, EditAction.class})
    @Size(min = 3, max = 50, message = "Team name must be between 3 and 50 characters", groups = {CreateAction.class, EditAction.class})
    @Pattern(regexp = "^[a-zA-Z0-9 ]+$", message = "Team name can only contain alphanumeric characters and spaces", groups = {CreateAction.class, EditAction.class})
    private String teamName;
}
