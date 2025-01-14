package org.league.app.dto;

import lombok.Setter;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Setter
public class GameSystemReadDto {

    Integer id;
    Integer sportId;
    String systemName;
    String rules;
    Integer minTeamSize;
    Integer maxTeamSize;
    Integer playersPerTeam;
    Boolean allowSubs;
    Integer maxSubs;
    Boolean isIndividual;
    Integer minAge;
    Integer maxAge;
    LocalDateTime createdAt;

}
