package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompetitionDto {

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