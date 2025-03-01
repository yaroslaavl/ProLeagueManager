package org.league.app.database.repository;

import org.league.app.database.entity.ReviewLikes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewLikesRepository extends JpaRepository<ReviewLikes, UUID> {

    Optional<ReviewLikes> findByFeedbackId(UUID feedbackId);

    Optional<ReviewLikes> findByFeedbackIdAndUserId(UUID feedbackId, Long userId);
}