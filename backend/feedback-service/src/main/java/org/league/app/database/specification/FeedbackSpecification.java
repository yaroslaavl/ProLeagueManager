package org.league.app.database.specification;

import org.league.app.database.entity.Feedback;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class FeedbackSpecification {

    public static Specification<Feedback> findAllFeedbackByDaysWeeksMonths(Integer days){
        return ((root, query, criteriaBuilder) -> {
            assert query != null;
            query.orderBy(criteriaBuilder.desc(root.get("createdAt")));
            return criteriaBuilder.between(
                    root.get("createdAt"),
                    LocalDateTime.now().minusDays(days),
                    LocalDateTime.now());
        });
    }
}