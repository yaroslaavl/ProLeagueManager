package org.league.app.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class CompetitionReadDto {

    UUID id;
    String name;
    Integer sportId;
    Integer gameSystemId;
    String competitionType;
    String status;
    LocalDateTime startDate;
    LocalDateTime endDate;
    LocalDateTime createdAt;
}
