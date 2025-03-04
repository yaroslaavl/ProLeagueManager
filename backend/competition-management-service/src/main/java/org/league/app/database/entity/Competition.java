package org.league.app.database.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.entity.enums.CompetitionType;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Table(schema = "public", name = "competition")
public class Competition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "name", nullable = false)
    @NotNull(message = "Competition name must be field")
    private String name;

    @Column(name = "sport_id")
    private Integer sportId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "game_system_id", nullable = false)
    private GameSystem gameSystem;

    @Column(name = "competition_type")
    @Enumerated(EnumType.STRING)
    private CompetitionType competitionType;

    @Column(name = "start_date")
    @NotNull(message = "Write the start date of your competition")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    @NotNull(message = "Write the end date of your competition")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "competition_status")
    private CompetitionStatus status;

    @Column(name = "image")
    private String competitionImage;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
