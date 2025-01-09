package org.league.app.mapper;

import org.league.app.database.entity.Competition;
import org.league.app.database.entity.CompetitionStage;
import org.league.app.dto.CompetitionStageCreateEditDto;
import org.league.app.dto.CompetitionStageReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface CompetitionStageMapper {

    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "competition", source = "competitionId", qualifiedByName = "mapToCompetition")
    CompetitionStage toEntity(CompetitionStageCreateEditDto competitionStageCreateEditDto);

    @Mapping(target = "competitionId", source = "competition.id")
    CompetitionStageReadDto toDto(CompetitionStage competitionStage);

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
