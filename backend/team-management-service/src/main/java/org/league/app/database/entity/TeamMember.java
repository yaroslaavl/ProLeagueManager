package org.league.app.database.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@ToString(exclude = "team")
@Table(schema = "team_management", name = "team_member")
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    @JsonBackReference
    private Team team;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToMany(cascade = CascadeType.PERSIST, fetch = FetchType.EAGER)
    @JoinTable(name = "team_member_role",
            joinColumns = @JoinColumn(name = "team_member_id"),
            inverseJoinColumns = @JoinColumn(name = "team_role_id"))
    private List<TeamRole> roles = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

}
