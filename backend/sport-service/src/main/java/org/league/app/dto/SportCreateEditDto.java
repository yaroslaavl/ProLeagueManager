package org.league.app.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;

@Data
public class SportCreateEditDto {

    @NotBlank(message = "Sport name cannot be empty", groups = {CreateAction.class, EditAction.class})
    @Pattern(regexp = "^([A-Z][a-z]*|[A-Z]+)(?:[\\s:-]([A-Z][a-z]*|[A-Z]+))*\\s?\\d*$", message = "Sport has incorrect name pattern", groups = {CreateAction.class, EditAction.class})
    String name;

    @NotNull(message = "Sport isEsport cannot be empty", groups = {CreateAction.class, EditAction.class})
    Boolean isEsport;
}