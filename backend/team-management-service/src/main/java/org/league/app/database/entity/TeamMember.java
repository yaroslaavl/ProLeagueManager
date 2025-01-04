package org.league.app.database.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@Table(schema = "public", name = "team_member")
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToMany(cascade = CascadeType.PERSIST, fetch = FetchType.EAGER)
    @JoinTable(name = "team_member_role",
            joinColumns = @JoinColumn(name = "team_member_id"),
            inverseJoinColumns = @JoinColumn(name = "team_role_id"))
    private List<TeamRole> roles = new ArrayList<>();

    @Column(name = "is_substitute")
    private Boolean isSubstitute;

    @CreationTimestamp
    @Column(name = "joined_at")
    private LocalDateTime joinedAt;

}
