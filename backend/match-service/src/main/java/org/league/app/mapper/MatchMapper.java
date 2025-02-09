package org.league.app.mapper;

import org.league.app.database.entity.Match;
import org.league.app.dto.MatchReadDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MatchMapper {

    MatchReadDto toDto(Match match);
}