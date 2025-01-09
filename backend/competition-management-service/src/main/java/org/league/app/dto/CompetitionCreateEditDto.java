package org.league.app.dto;

import lombok.Data;

import java.util.Date;

@Data
public class CompetitionCreateEditDto {

    private String name;
    private Integer sportId;
    private Integer gameSystemId;
    private String competitionType;
    private Date startDate;
    private Date endDate;
}
