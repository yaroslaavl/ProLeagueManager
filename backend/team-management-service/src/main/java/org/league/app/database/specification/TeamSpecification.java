package org.league.app.database.specification;

import org.league.app.database.entity.Team;
import org.league.app.database.entity.enums.TeamStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class TeamSpecification {

    public static Specification<Team> search(String keyword) {
        return (root, query, criteriaBuilder) -> {
            assert query != null;
            query.orderBy(criteriaBuilder.asc(root.get("teamName")));
            if (keyword == null || keyword.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("teamName")), keyword.toLowerCase() + "%"
            );
        };
    }

    public static Specification<Team> hasStatus(String teamStatus) {
        return (root, query, criteriaBuilder) -> {
            if (teamStatus == null || teamStatus.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.equal(root.get("teamStatus"), teamStatus);
        };
    }
}