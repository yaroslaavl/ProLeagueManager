package org.league.app.mapper;

import org.league.app.database.entity.LeagueStanding;
import org.league.app.dto.LeagueStandingReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LeagueStandingMapper {

    @Mapping(target = "competitionId", source = "competition.id")
    LeagueStandingReadDto toDto(LeagueStanding leagueStanding);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "competition.id", source = "competitionId")
    LeagueStanding toEntity(LeagueStandingReadDto leagueStandingReadDto);
}