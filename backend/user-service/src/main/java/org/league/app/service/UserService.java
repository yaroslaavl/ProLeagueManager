package org.league.app.service;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.RoleGroup;
import org.league.app.database.entity.User;
import org.league.app.database.repository.RoleGroupRepository;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.UserCreateEditDto;
import org.league.app.dto.UserReadDto;
import org.league.app.exception.UserAlreadyVerified;
import org.league.app.feign.EmailRequest;
import org.league.app.feign.NotificationFeignClient;
import org.league.app.exception.RoleGroupNotFound;
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

    private final UserMapper userMapper;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleGroupRepository roleGroupRepository;
    private final NotificationFeignClient notificationFeignClient;

    @Transactional
    public UserReadDto create(UserCreateEditDto userCreateEditDto){
        String activationToken = UUID.randomUUID().toString();
        RoleGroup user = roleGroupRepository.findByName("User")
                .orElseThrow(() -> new RoleGroupNotFound("Group not found"));

        User newUser = Optional.of(userCreateEditDto)
                .map(dto -> {
                    User entity = userMapper.toEntity(dto, passwordEncoder);
                    entity.setRoleGroup(user);
                    entity.setIsVerified(false);
                    entity.setEmailVerificationToken(activationToken);
                    return userRepository.saveAndFlush(entity);
                })
                .orElseThrow();

        String confirmationLink = "http://localhost:8765/auth/activate?token=" + activationToken;
        notificationFeignClient.sendEmail(new EmailRequest(
                userCreateEditDto.getEmail(),
                "Confirm your email",
                  "You have successfully registered! Verify your email for full access: " + confirmationLink
        ));

        log.info("Email: {}, Subject: {}, Body: {}",
                userCreateEditDto.getEmail(),
                "Confirm your email",
                "Click the link to confirm your account: " + confirmationLink);

        return userMapper.toDto(newUser);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        if (username == null || username.isEmpty()) {
            throw new UsernameNotFoundException("User not found");
        }
        return userRepository.findByUsername(username)
                .map(user -> {
                    Set<GrantedAuthority> authorities = new HashSet<>();
                    RoleGroup roleGroup = user.getRoleGroup();
                    if (roleGroup != null) {
                        roleGroup.getRoles().forEach(role -> {
                            authorities.add(new SimpleGrantedAuthority(role.getName()));
                        });
                    }
                    return new org.springframework.security.core.userdetails.User(
                            user.getUsername(),
                            user.getPassword(),
                            authorities
                    );
                })
                .orElseThrow(() -> new UsernameNotFoundException("Failed to retrieve user:" + username));
    }

    @Transactional
    public boolean emailConfirmation(String token){
        User userByToken = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new UsernameNotFoundException("Email verification token not found"));

        userByToken.setEmailVerificationToken(null);
        userByToken.setIsVerified(true);
        userRepository.saveAndFlush(userByToken);

        return true;
    }

}
