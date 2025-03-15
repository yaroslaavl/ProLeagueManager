package org.league.app.database.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Table(schema = "feedback", name = "feedback")
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "competition_id")
    private UUID competitionId;

    @Column(name = "message")
    private String message;

    @Column(name = "likes")
    private Integer likes;

    @Column(name = "tonality")
    private String tonality;

    @Column(name = "lang")
    private String lang;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}