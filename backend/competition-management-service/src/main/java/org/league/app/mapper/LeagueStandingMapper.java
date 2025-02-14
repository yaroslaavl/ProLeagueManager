package org.league.app.mapper;

import org.league.app.database.entity.LeagueStanding;
import org.league.app.dto.LeagueStandingReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LeagueStandingMapper {

    @Mapping(target = "competitionId", source = "competition.id")
    LeagueStandingReadDto toDto(LeagueStanding leagueStanding);
}