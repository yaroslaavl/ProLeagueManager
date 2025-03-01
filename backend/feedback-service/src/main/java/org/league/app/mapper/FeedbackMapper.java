package org.league.app.mapper;

import org.league.app.database.entity.Feedback;
import org.league.app.dto.FeedbackReadDto;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface FeedbackMapper {

    FeedbackReadDto toDto(Feedback feedback);
}