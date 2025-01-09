package org.league.app.database.repository;

import org.league.app.database.entity.GameSystem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface GameSystemRepository extends JpaRepository<GameSystem, Integer> {

    Optional<GameSystem> findGameSystemBySystemName(String systemName);
}
