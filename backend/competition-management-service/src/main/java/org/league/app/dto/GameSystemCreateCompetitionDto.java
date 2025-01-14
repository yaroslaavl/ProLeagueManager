package org.league.app.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class GameSystemCreateCompetitionDto {

    private Integer systemId;
    private String systemName;
    private Boolean isIndividual;
    private Integer sportId;
    private String sportName;
}
