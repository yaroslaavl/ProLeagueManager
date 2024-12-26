package org.league.app.mapper;

import org.league.app.database.entity.UserNotificationSubscription;
import org.league.app.dto.UserNotificationSubscriptionCreateEditDto;
import org.league.app.dto.UserNotificationSubscriptionReadDto;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface UserNotificationSubscriptionMapper {

   @Mapping(target = "updatedAt", ignore = true)
   @Mapping(target = "id", ignore = true)
   @Mapping(target = "createdAt", ignore = true)
   UserNotificationSubscription toEntity(UserNotificationSubscriptionCreateEditDto userNotificationSubscriptionCreateDto);

   UserNotificationSubscriptionReadDto toDto(UserNotificationSubscription userNotificationSubscription);
}
