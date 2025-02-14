package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.dto.LeagueStandingReadDto;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeagueBracketDto implements Serializable {

    public CompetitionReadDto competition;
    public LeagueStandingReadDto leagueStanding;
}