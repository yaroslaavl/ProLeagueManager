package org.league.app.mapper;

import org.league.app.database.entity.Sport;
import org.league.app.dto.SportCreateEditDto;
import org.league.app.dto.SportReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface SportMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Sport toEntity(SportCreateEditDto sportCreateDto);

    SportReadDto toDto(Sport sport);

}