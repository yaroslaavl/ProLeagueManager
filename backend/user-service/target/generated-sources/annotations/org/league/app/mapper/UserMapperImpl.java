package org.league.app.mapper;

import java.time.LocalDate;
import javax.annotation.processing.Generated;
import org.league.app.database.entity.Role;
import org.league.app.database.entity.User;
import org.league.app.dto.UserCreateEditDto;
import org.league.app.dto.UserReadDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2024-11-21T01:09:39+0100",
    comments = "version: 1.5.5.Final, compiler: javac, environment: Java 21.0.1 (Oracle Corporation)"
)
@Component
public class UserMapperImpl implements UserMapper {

    @Override
    public User toEntity(UserCreateEditDto userCreateEditDto, PasswordEncoder passwordEncoder) {
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
        user.role( userCreateEditDto.getRole() );
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
        String password = null;
        String firstName = null;
        String lastName = null;
        LocalDate birthDate = null;
        Role role = null;
        Boolean isVerified = null;

        id = user.getId();
        username = user.getUsername();
        email = user.getEmail();
        password = user.getPassword();
        firstName = user.getFirstName();
        lastName = user.getLastName();
        birthDate = user.getBirthDate();
        role = user.getRole();
        isVerified = user.getIsVerified();

        UserReadDto userReadDto = new UserReadDto( id, username, email, password, firstName, lastName, birthDate, role, isVerified );

        return userReadDto;
    }
}
