package org.league.app.database.repository;

import org.league.app.database.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SportRepository extends JpaRepository<Sport, Integer> {

    Optional<Sport> findByName(String name);

    int deleteSportByName(String name);

}