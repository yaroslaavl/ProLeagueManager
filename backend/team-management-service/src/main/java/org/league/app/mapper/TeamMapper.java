package org.league.app.mapper;

import org.league.app.database.entity.Team;
import org.league.app.dto.TeamCreateEditDto;
import org.league.app.dto.TeamReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface TeamMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "teamStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Team toEntity(TeamCreateEditDto teamCreateDto);

    TeamReadDto toDto(Team team);
}
