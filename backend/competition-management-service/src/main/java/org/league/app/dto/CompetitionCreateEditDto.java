package org.league.app.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class CompetitionCreateEditDto {

    private String name;
    private Integer sportId;
    private Integer gameSystemId;
    private String competitionType;
    private String status;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
