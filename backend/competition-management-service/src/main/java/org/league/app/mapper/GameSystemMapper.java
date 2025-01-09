package org.league.app.mapper;

import org.league.app.database.entity.GameSystem;
import org.league.app.dto.GameSystemCreateEditDto;
import org.league.app.dto.GameSystemReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface GameSystemMapper {

    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    GameSystem toEntity(GameSystemCreateEditDto gameSystemCreateEditDto);

    GameSystemReadDto toDto(GameSystem gameSystem);

}
