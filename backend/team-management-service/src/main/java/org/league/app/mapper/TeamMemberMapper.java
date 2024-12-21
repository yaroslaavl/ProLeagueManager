package org.league.app.mapper;

import org.league.app.database.entity.TeamMember;
import org.league.app.dto.TeamMemberCreateDto;
import org.league.app.dto.TeamMemberReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TeamMemberMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "joinedAt", ignore = true)
    TeamMember toEntity(TeamMemberCreateDto teamMemberCreateDto);

    TeamMemberReadDto toDto(TeamMember teamMember);
}
