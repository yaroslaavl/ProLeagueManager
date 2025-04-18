package org.league.app.database.repository;

import org.league.app.database.entity.Feedback;
import org.league.app.dto.FeedbackReadDto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface FeedbackRepository extends JpaRepository<Feedback, UUID>, JpaSpecificationExecutor<Feedback> {

    @Query("SELECT f FROM Feedback f ORDER BY f.createdAt DESC")
    List<Feedback> findAllSortByCreatedAt();

    @Query("SELECT f.tonality, COUNT(f) FROM Feedback f WHERE f.createdAt BETWEEN :from AND :to GROUP BY f.tonality")
    List<Object[]> findAllByTonality(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    List<Feedback> findAllByCompetitionId(UUID competitionId);
}