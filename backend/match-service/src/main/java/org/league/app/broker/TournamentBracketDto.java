package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentBracketDto {

    public CompetitionDto competition;
    public List<TournamentStageDto> stageList;
    public SportDto sport;
    public List<CompetitionParticipantDto> competitionParticipantList;
}