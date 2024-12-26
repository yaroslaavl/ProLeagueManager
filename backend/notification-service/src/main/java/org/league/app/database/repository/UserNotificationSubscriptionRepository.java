package org.league.app.database.repository;

import org.league.app.database.entity.UserNotificationSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface UserNotificationSubscriptionRepository extends JpaRepository<UserNotificationSubscription, Long> {

    Optional<UserNotificationSubscription> findUserNotificationSubscriptionByUserId(Long userId);

    List<UserNotificationSubscription> findAllByUserId(Long userId);
}
