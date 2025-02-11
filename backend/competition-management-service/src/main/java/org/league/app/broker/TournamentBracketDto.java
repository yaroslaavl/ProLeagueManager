package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.league.app.dto.CompetitionParticipantReadDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.dto.TournamentStageReadDto;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentBracketDto {

    public CompetitionReadDto competition;
    public List<TournamentStageReadDto> stageList;
    public List<CompetitionParticipantReadDto> competitionParticipantList;
}
