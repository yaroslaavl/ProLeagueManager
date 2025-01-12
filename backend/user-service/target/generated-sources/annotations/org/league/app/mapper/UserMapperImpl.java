package org.league.app.mapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import javax.annotation.processing.Generated;
import org.league.app.database.entity.RoleGroup;
import org.league.app.database.entity.User;
import org.league.app.dto.UserCreateDto;
import org.league.app.dto.UserPublicProfileDto;
import org.league.app.dto.UserReadDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2025-01-10T19:31:01+0100",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 23 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toEntity(UserCreateDto userCreateEditDto, PasswordEncoder passwordEncoder) {
        if ( userCreateEditDto == null ) {
            return null;
        }

        User.UserBuilder user = User.builder();

        user.id( userCreateEditDto.getId() );
        user.username( userCreateEditDto.getUsername() );
        user.email( userCreateEditDto.getEmail() );
        user.firstName( userCreateEditDto.getFirstName() );
        user.lastName( userCreateEditDto.getLastName() );
        user.birthDate( userCreateEditDto.getBirthDate() );
        user.roleGroup( userCreateEditDto.getRoleGroup() );
        user.isVerified( userCreateEditDto.getIsVerified() );
        user.emailVerificationToken( userCreateEditDto.getEmailVerificationToken() );

        user.password( passwordEncoder.encode(userCreateEditDto.getPassword()) );

        return user.build();
    }

    @Override
    public UserReadDto toDto(User user) {
        if ( user == null ) {
            return null;
        }

        Long id = null;
        String username = null;
        String email = null;
        String firstName = null;
        String lastName = null;
        LocalDate birthDate = null;
        RoleGroup roleGroup = null;
        Boolean isVerified = null;
        String avatar = null;
        LocalDateTime createdAt = null;

        id = user.getId();
        username = user.getUsername();
        email = user.getEmail();
        firstName = user.getFirstName();
        lastName = user.getLastName();
        birthDate = user.getBirthDate();
        roleGroup = user.getRoleGroup();
        isVerified = user.getIsVerified();
        avatar = user.getAvatar();
        createdAt = user.getCreatedAt();

        UserReadDto userReadDto = new UserReadDto( id, username, email, firstName, lastName, birthDate, roleGroup, isVerified, avatar, createdAt );

        return userReadDto;
    }

    @Override
    public UserPublicProfileDto toPublicProfileDto(User user) {
        if ( user == null ) {
            return null;
        }

        Long id = null;
        String username = null;
        String firstName = null;
        String lastName = null;
        LocalDate birthDate = null;
        String avatar = null;
        LocalDateTime createdAt = null;

        id = user.getId();
        username = user.getUsername();
        firstName = user.getFirstName();
        lastName = user.getLastName();
        birthDate = user.getBirthDate();
        avatar = user.getAvatar();
        createdAt = user.getCreatedAt();

        UserPublicProfileDto userPublicProfileDto = new UserPublicProfileDto( id, username, firstName, lastName, birthDate, avatar, createdAt );

        return userPublicProfileDto;
    }
}
