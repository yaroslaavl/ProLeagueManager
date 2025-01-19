package org.league.app.database.specification;

import jakarta.persistence.criteria.Join;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.GameSystem;
import org.league.app.database.entity.enums.CompetitionType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CompetitionSpecification {

  public static Specification<Competition> isCompetitionIndividual(Boolean isIndividual) {
      return (root, query, criteriaBuilder) -> {
          Join<Competition, GameSystem> gameSystem = root.join("gameSystem");

          return gameSystem.get("isIndividual").in(isIndividual);
      };
  }

    public static Specification<Competition> isEsport(List<Integer> sportIds) {
        return (root, query, criteriaBuilder) -> {
            if (sportIds == null || sportIds.isEmpty()) {
                return criteriaBuilder.conjunction();
            }
            return root.get("sportId").in(sportIds);
        };
    }

  public static Specification<Competition> hasCompetitionStatus(String status) {
      return (root, query, criteriaBuilder) ->
              criteriaBuilder.equal(root.get("status"), status);
  }

  public static Specification<Competition> search(String keyword) {
      return (root, query, criteriaBuilder) -> {
          if (keyword == null || keyword.isEmpty()) {
              return criteriaBuilder.conjunction();
          }
          return criteriaBuilder.like(
                  criteriaBuilder.lower(root.get("name")), "%" + keyword.toLowerCase() + "%"
          );
      };
  }

  public static Specification<Competition> hasCompetitionType(CompetitionType competitionType) {
      return (root, query, criteriaBuilder) ->
              criteriaBuilder.equal(root.get("competitionType"), competitionType);
  }

}
