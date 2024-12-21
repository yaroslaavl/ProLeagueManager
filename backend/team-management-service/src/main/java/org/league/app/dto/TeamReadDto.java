package org.league.app.dto;

import lombok.Value;
import org.league.app.database.entity.enums.TeamStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class TeamReadDto {

    UUID id;

    String teamName;

    String teamImage;

    TeamStatus teamStatus;

    LocalDateTime createdAt;

}
