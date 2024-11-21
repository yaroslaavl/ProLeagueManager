package org.league.app.mapper;

import org.league.app.database.entity.User;
import org.league.app.dto.UserCreateEditDto;
import org.league.app.dto.UserReadDto;
import org.mapstruct.Context;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Mappings;
import org.springframework.security.crypto.password.PasswordEncoder;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mappings({
            @Mapping(target = "password", expression = "java(passwordEncoder.encode(userCreateEditDto.getPassword()))"),
    })
    User toEntity(UserCreateEditDto userCreateEditDto, @Context PasswordEncoder passwordEncoder);

    UserReadDto toDto(User user);
}
