package org.league.app.mapper;

import org.league.app.database.entity.Competition;
import org.league.app.database.entity.GameSystem;
import org.league.app.dto.CompetitionCreateEditDto;
import org.league.app.dto.CompetitionReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface CompetitionMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "startDate", ignore = true)
    @Mapping(target = "endDate", ignore = true)
    @Mapping(target = "gameSystem", source = "gameSystemId", qualifiedByName = "mapToGameSystem")
    Competition toEntity(CompetitionCreateEditDto competitionCreateEditDto);

    @Mapping(target = "gameSystemId", source = "gameSystem.id")
    CompetitionReadDto toDto (Competition competition);

    @Named("mapToGameSystem")
    default GameSystem mapToGameSystem(Integer gameSystemId) {
        if(gameSystemId == null) {
            return null;
        }
        return GameSystem.builder()
                .id(gameSystemId)
                .build();
    }

}
