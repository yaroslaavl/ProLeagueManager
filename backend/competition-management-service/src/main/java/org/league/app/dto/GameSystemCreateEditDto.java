package org.league.app.dto;

import lombok.Data;

@Data
public class GameSystemCreateEditDto {

    private Integer sportId;
    private String systemName;
    private String rules;
    private Integer minTeamSize;
    private Integer maxTeamSize;
    private Integer playersPerTeam;
    private Boolean allowSubs;
    private Integer maxSubs;
    private Boolean isIndividual;
    private Integer minAge;
    private Integer maxAge;

}
