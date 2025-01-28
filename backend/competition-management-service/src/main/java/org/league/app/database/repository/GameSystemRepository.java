package org.league.app.database.repository;

import org.league.app.database.entity.GameSystem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameSystemRepository extends JpaRepository<GameSystem, Integer> {

    Optional<GameSystem> findGameSystemBySystemName(String systemName);

    List<GameSystem> findAllBySportIdIn(List<Integer> sportIds);

    @Query("SELECT gs.playersPerTeam + CASE WHEN gs.allowSubs THEN gs.maxSubs ELSE 0 END FROM GameSystem gs WHERE gs.id = :gameSystemId")
    Integer countMaxPlayersPerTeamAtCompetition(@Param("gameSystemId") Integer gameSystemId);

    @Query("SELECT gs.playersPerTeam FROM GameSystem gs WHERE gs.id = :gameSystemId")
    Integer countMinPlayersPerTeamAtCompetition(@Param("gameSystemId") Integer gameSystemId);
}
