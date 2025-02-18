package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.league.app.dto.CompetitionParticipantReadDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.dto.TournamentStageReadDto;
import org.league.app.feign.sportClient.SportDto;

import java.io.Serializable;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TournamentBracketDto implements Serializable {

    public CompetitionReadDto competition;
    public List<TournamentStageReadDto> stageList;
    public SportDto sport;
    public List<CompetitionParticipantReadDto> competitionParticipantList;
}
