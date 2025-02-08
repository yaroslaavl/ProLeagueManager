package org.league.app.mapper;

import org.league.app.database.entity.Competition;
import org.league.app.database.entity.TournamentStage;
import org.league.app.dto.TournamentStageCreateEditDto;
import org.league.app.dto.TournamentStageReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface TournamentStageMapper {

    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "competition", source = "competitionId", qualifiedByName = "mapToCompetition")
    TournamentStage toEntity(TournamentStageCreateEditDto competitionStageCreateEditDto);

    @Mapping(target = "competitionId", source = "competition.id")
    TournamentStageReadDto toDto(TournamentStage competitionStage);

    @Named("mapToCompetition")
    default Competition mapToCompetition(UUID competitionId) {
        if(competitionId == null) {
            return null;
        }
        return Competition.builder()
                .id(competitionId)
                .build();
    }
}
