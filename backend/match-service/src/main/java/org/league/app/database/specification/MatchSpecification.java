package org.league.app.database.specification;

import org.league.app.database.entity.Match;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
public class MatchSpecification {

    public static Specification<Match> getMatchesByDynamicMatchType(List<String> matchStatuses) {
        return (root, query, criteriaBuilder) -> {
            if (matchStatuses != null && !matchStatuses.isEmpty()) {
                criteriaBuilder.disjunction();
            }
            return root.get("matchStatus").in(matchStatuses);
        };
    }

    public static Specification<Match> getMatchesByCompetitionId(UUID competitionId) {
        return (root, query, criteriaBuilder) ->
            criteriaBuilder.equal(root.get("competitionId"), competitionId);
    }
}
