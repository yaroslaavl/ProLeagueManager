package org.league.app.database.specification;

import jakarta.persistence.criteria.Join;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.GameSystem;
import org.league.app.database.entity.enums.CompetitionType;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

@Component
public class CompetitionSpecification {

  public static Specification<Competition> isCompetitionIndividual(Boolean isIndividual) {
      return (root, query, criteriaBuilder) -> {
          Join<Competition, GameSystem> gameSystem = root.join("gameSystem");

          return gameSystem.get("isIndividual").in(isIndividual);
      };
  }

  public static Specification<Competition> hasCompetitionStatus(String status) {
      return (root, query, criteriaBuilder) ->
              criteriaBuilder.equal(root.get("status"), status);
  }

  public static Specification<Competition> search(String keyword) {
      if (keyword == null) {
          return null;
      }

      return (root, query, criteriaBuilder) ->
              criteriaBuilder.like(root.get("name"), keyword + "%");
  }

  public static Specification<Competition> isTournament(CompetitionType competitionType) {
      return (root, query, criteriaBuilder) ->
              criteriaBuilder.equal(root.get("competitionType"), competitionType);
  }

}
