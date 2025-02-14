package org.league.app.broker;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LeagueBracketDto implements Serializable {

    public CompetitionDto competition;
    public LeagueStandingDto leagueStanding;
}
