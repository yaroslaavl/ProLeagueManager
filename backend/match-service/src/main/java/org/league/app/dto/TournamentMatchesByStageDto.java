package org.league.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.league.app.database.entity.Match;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TournamentMatchesByStageDto {

    public String stageName;
    public Integer stageOrder;
    public List<Match> matchList;
}
