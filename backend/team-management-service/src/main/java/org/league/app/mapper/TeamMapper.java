package org.league.app.mapper;

import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.TeamRole;
import org.league.app.dto.TeamCreateEditDto;
import org.league.app.dto.TeamReadDto;
import org.league.app.feign.teamClietnt.TeamFeignDto;
import org.league.app.feign.teamClietnt.TeamMemberFeignDto;
import org.league.app.feign.teamClietnt.TeamRoleFeignDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TeamMapper {

    @Mapping(target = "teamMemberList", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "teamImage", ignore = true)
    @Mapping(target = "teamStatus", ignore = true)
    Team toEntity(TeamCreateEditDto teamCreateDto);

    TeamReadDto toDto(Team team);

    @Mapping(source = "teamMemberList", target = "teamMembers")
    TeamFeignDto toTeamFeignDto(Team team);

    @Mapping(source = "userId", target = "userId")
    @Mapping(source = "roles", target = "roles")
    TeamMemberFeignDto mapTeamMember(TeamMember member);

    @Mapping(target = "roleName", source = "name")
    TeamRoleFeignDto mapTeamRole(TeamRole role);
}
