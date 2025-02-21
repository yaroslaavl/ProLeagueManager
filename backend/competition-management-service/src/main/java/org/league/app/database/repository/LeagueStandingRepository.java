package org.league.app.database.repository;

import org.league.app.database.entity.LeagueStanding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LeagueStandingRepository extends JpaRepository<LeagueStanding, UUID> {

    List<LeagueStanding> findAllByCompetitionId(UUID competitionId);

    @Query("SELECT ls FROM LeagueStanding ls WHERE ls.competition.id = :competitionId AND (ls.teamId = :teamIds OR ls.playerId = :playerIds)")
    List<LeagueStanding> findLeagueStandingByCompetitionIdWherePlayerIdOrTeamId(@Param("competitionId") UUID competitionId,
                                                                          @Param("teamIds") List<UUID> teamIds,
                                                                          @Param("playerIds") List<Long> playerIds);
}