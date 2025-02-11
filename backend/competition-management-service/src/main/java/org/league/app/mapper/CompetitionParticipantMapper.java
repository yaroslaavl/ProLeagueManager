package org.league.app.mapper;

import org.league.app.database.entity.Competition;
import org.league.app.database.entity.CompetitionParticipant;
import org.league.app.dto.CompetitionParticipantCreateEditDto;
import org.league.app.dto.CompetitionParticipantReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface CompetitionParticipantMapper {

    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "competition", source = "competitionId", qualifiedByName = "mapToCompetition")
    CompetitionParticipant toEntity(CompetitionParticipantCreateEditDto competitionParticipantCreateEditDto);

    @Mapping(target = "competitionId", source = "competition.id")
    @Mapping(target = "competitionParticipantStatus", expression = "java(competitionParticipant.getCompetitionParticipantStatus() != null ? competitionParticipant.getCompetitionParticipantStatus().name() : null)")
    CompetitionParticipantReadDto toDto(CompetitionParticipant competitionParticipant);

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

