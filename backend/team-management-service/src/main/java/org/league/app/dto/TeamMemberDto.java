package org.league.app.dto;

import lombok.Value;
import java.util.List;

@Value
public class TeamMemberDto {

    TeamReadDto team;
    List<TeamMemberCreateDto> members;
}
