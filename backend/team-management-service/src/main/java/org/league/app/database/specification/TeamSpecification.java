package org.league.app.database.specification;

import org.league.app.database.entity.Team;
import org.league.app.database.entity.enums.TeamStatus;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class TeamSpecification {

    public static Specification<Team> search(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return criteriaBuilder.like(
                    criteriaBuilder.lower(root.get("teamName")), "%" + keyword.toLowerCase() + "%"
            );
        };
    }

    public static Specification<Team> hasStatus(String teamStatus) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("teamStatus"), teamStatus);
    }
}