package org.league.app.database.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.league.app.database.entity.enums.MatchStatus;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@AllArgsConstructor
@NoArgsConstructor
@Builder(toBuilder = true)
@Table(schema = "match", name = "match")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "competition_id")
    private UUID competitionId;

    @Column(name = "stage_id")
    private UUID stageId;

    @Column(name = "team_a_id")
    private UUID teamAId;

    @Column(name = "team_b_id")
    private UUID teamBId;

    @Column(name = "player_a_id")
    private Long playerAId;

    @Column(name = "player_b_id")
    private Long playerBId;

    @Column(name = "match_date")
    private LocalDateTime matchDate;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private MatchStatus matchStatus;

    @Column(name = "score_a")
    private Integer scoreA;

    @Column(name = "score_b")
    private Integer scoreB;

    @Column(name = "is_overtime")
    private Boolean isOvertime;

    @Column(name = "is_draw")
    private Boolean isDraw;

    @Column(name = "winner_team_id")
    private UUID winnerTeamId;

    @Column(name = "winner_player_id")
    private Long winnerPlayerId;

    @Column(name = "league_tour_number")
    private Integer leagueTourNumber;

    @Column(name = "a_confirmed")
    private Boolean aConfirmed;

    @Column(name = "B_confirmed")
    private Boolean bConfirmed;

    @Column(name = "next_match_id")
    private UUID nextMatchId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
