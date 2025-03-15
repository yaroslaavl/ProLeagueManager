package org.league.app.database.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Table(schema = "competition_management", name = "game_system")
public class GameSystem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "sport_id", nullable = false)
    private Integer sportId;

    @Column(name = "name", nullable = false, length = 100)
    private String systemName;

    @Column(name = "rules")
    private String rules;

    @Column(name = "min_team")
    private Integer minTeamSize;

    @Column(name = "max_team")
    private Integer maxTeamSize;

    @Column(name = "players_per_team")
    private Integer playersPerTeam;

    @Column(name = "allow_subs", nullable = false)
    private Boolean allowSubs;

    @Column(name = "max_subs")
    private Integer maxSubs;

    @Column(name = "is_individual", nullable = false)
    private Boolean isIndividual;

    @Column(name = "min_age")
    private Integer minAge;

    @Column(name = "max_age")
    private Integer maxAge;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
