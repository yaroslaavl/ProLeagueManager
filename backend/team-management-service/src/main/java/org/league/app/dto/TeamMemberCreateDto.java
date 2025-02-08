package org.league.app.dto;

import lombok.Data;
import org.league.app.database.entity.TeamRole;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class TeamMemberCreateDto {

    private UUID teamId;

    private Long userId;

    private List<TeamRole> roles;

    private LocalDateTime joinedAt;
}
