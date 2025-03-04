package org.league.app.mapper;

import org.league.app.database.entity.Event;
import org.league.app.dto.EventCreateEditDto;
import org.league.app.dto.EventReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EventMapper {

    EventReadDto toDto(Event event);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Event toEntity(EventCreateEditDto eventCreateEditDto);
}
