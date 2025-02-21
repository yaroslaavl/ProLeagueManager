package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class LeagueBracketDto {

    public CompetitionDto competition;
    public List<LeagueStandingDto> leagueStanding;
}
