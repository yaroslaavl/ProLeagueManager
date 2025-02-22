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

    @Query("SELECT ls FROM LeagueStanding ls WHERE ls.competition.id = :competitionId AND (ls.teamId IN :teamIds OR ls.playerId IN :playerIds)")
    List<LeagueStanding> findLeagueStandingsByCompetitionIdWherePlayerIdOrTeamId(@Param("competitionId") UUID competitionId,
                                                                          @Param("teamIds") List<UUID> teamIds,
                                                                          @Param("playerIds") List<Long> playerIds);

    @Query("SELECT ls FROM LeagueStanding ls WHERE ls.competition.id = :competitionId AND (ls.teamId = :teamId OR ls.playerId = :playerId)")
    LeagueStanding findLeagueStandingByCompetitionIdWhereTeamIdOrPlayerId(@Param("competitionId") UUID competitionId,
                                                                          @Param("teamId") UUID teamId,
                                                                          @Param("playerId") Long playerId);

    @Query(value = """
    SELECT ls FROM LeagueStanding ls
        WHERE ls.competition.id = :competitionId
            AND ls.points = (
                SELECT MAX(ls2.points) FROM LeagueStanding ls2
                    WHERE ls2.competition.id = :competitionId
                )
    """)
    List<LeagueStanding> findLeagueStandingsMaxPointsByCompetitionId(@Param("competitionId")UUID competitionId);
}