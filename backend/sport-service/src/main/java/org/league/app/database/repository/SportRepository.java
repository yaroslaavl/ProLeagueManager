package org.league.app.database.repository;

import org.league.app.database.entity.Sport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SportRepository extends JpaRepository<Sport, Integer> {

    Optional<Sport> findByName(String name);

    int deleteSportByName(String name);

    @Query("SELECT s FROM Sport s WHERE LOWER(s.name) LIKE LOWER(CONCAT(:sportName, '%'))")
    List<Sport> findByNameSearch(@Param("sportName") String sportName);
}