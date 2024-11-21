package org.league.app.service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Role;
import org.league.app.database.entity.User;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.UserCreateEditDto;
import org.league.app.dto.UserReadDto;
import org.league.app.mapper.UserMapper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserReadDto create(UserCreateEditDto userCreateEditDto){
        String activationToken = UUID.randomUUID().toString();

        return Optional.of(userCreateEditDto)
                .map(dto -> {
                    User entity = userMapper.toEntity(dto, passwordEncoder);
                    entity.setRole(Role.USER);
                    entity.setIsVerified(false);
                    entity.setEmailVerificationToken(activationToken);
                    return userRepository.saveAndFlush(entity);
                })
                .map(userMapper::toDto)
                .orElseThrow();
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.isEmpty()) {
            throw new UsernameNotFoundException("User not found");
        }
        return userRepository.findByUsername(username)
                .map(user -> {
                    Set<GrantedAuthority> authorities = new HashSet<>();
                    authorities.add(new SimpleGrantedAuthority(user.getRole().toString()));
                    return new org.springframework.security.core.userdetails.User(
                            user.getUsername(),
                            user.getPassword(),
                            authorities
                    );
                })
                .orElseThrow(() -> new UsernameNotFoundException("Failed to retrieve user:" + username));
    }
}
