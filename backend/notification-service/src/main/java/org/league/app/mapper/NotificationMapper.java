package org.league.app.mapper;

import org.league.app.database.entity.Notification;
import org.league.app.dto.NotificationCreateDto;
import org.league.app.dto.NotificationReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface NotificationMapper {

    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "id", ignore = true)
    Notification toEntity(NotificationCreateDto notificationCreateDto);

    NotificationReadDto toDto(Notification notification);
}
