package org.league.app.service;

import lombok.RequiredArgsConstructor;
import org.league.app.exception.*;
import org.league.app.redisclient.RedisClient;
import org.springframework.beans.factory.annotation.Value;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.RoleGroup;
import org.league.app.database.entity.User;
import org.league.app.database.repository.RoleGroupRepository;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.*;
import org.league.app.feign.EmailRequest;
import org.league.app.feign.NotificationFeignClient;
import org.league.app.mapper.UserMapper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService implements UserDetailsService {

    private final UserMapper userMapper;
    private final RedisClient redisClient;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleGroupRepository roleGroupRepository;
    private final NotificationFeignClient notificationFeignClient;

    @Transactional
    public UserReadDto create(UserCreateDto userCreateDto){
        String activationToken = UUID.randomUUID().toString();
        RoleGroup userRoleGroup = roleGroupRepository.findByName("USER")
                .orElseThrow(() -> new RoleGroupNotFoundException("Group not found"));

        User newUser = Optional.of(userCreateDto)
                .map(dto -> {
                    User entity = userMapper.toEntity(dto, passwordEncoder);
                    entity.setRoleGroup(userRoleGroup);
                    entity.setIsVerified(false);
                    entity.setEmailVerificationToken(activationToken);
                    return userRepository.saveAndFlush(entity);
                })
                .orElseThrow();

        String confirmationLink = "http://localhost:8765/auth/activate?token=" + activationToken;
        notificationFeignClient.sendEmail(new EmailRequest(
                userCreateDto.getEmail(),
                "Confirm your email",
                  "You have successfully registered! Verify your email for full access: " + confirmationLink
        ));

        redisClient.set(newUser.getEmail() + ":activationToken", activationToken, 1, TimeUnit.DAYS);

        log.info("Email: {}, Subject: {}, Body: {}",
                userCreateDto.getEmail(),
                "Confirm your email",
                "Click the link to confirm your account: " + confirmationLink);

        return userMapper.toDto(newUser);
    }

    public UserReadDto getUser(Long id){
        return userMapper.toDto(userRepository.findById(id).orElseThrow(() -> new UserNotFoundException("User not found")));
    }

    public boolean sendPasswordResetEmail(EmailResetPasswordDto emailResetPasswordDto) {
        if (emailResetPasswordDto.getEmail() == null || !userRepository.existsByEmail(emailResetPasswordDto.getEmail())) {
            throw new UsernameNotFoundException("User not found");
        }

        String resetToken = UUID.randomUUID().toString();
        String resetUrl = "http://localhost:8765/user/reset-password-check/" + resetToken;

        try {
            notificationFeignClient.sendEmail(new EmailRequest(
                    emailResetPasswordDto.getEmail(),
                    "Password Reset Request",
                    "Click the link to reset your password: " + resetUrl
            ));

            redisClient.set(emailResetPasswordDto.getEmail() + ":resetPasswordToken", resetToken, 5, TimeUnit.MINUTES);
            redisClient.set(resetToken, emailResetPasswordDto.getEmail(), 5,TimeUnit.MINUTES);

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    @Transactional
    public void resetPassword(ResetPasswordDto resetPasswordDto, String token) {
        if (token == null || token.isEmpty()) {
            throw new IllegalArgumentException("Invalid or missing token");
        }

        String userEmail = redisClient.get(token);
        if (userEmail == null) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        String storedToken = redisClient.get(userEmail + ":resetPasswordToken");
        if (storedToken == null || !storedToken.equals(token)) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserEmailNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(resetPasswordDto.getNewPassword()));
        userRepository.save(user);

        redisClient.delete(userEmail + ":resetPasswordToken");
        redisClient.delete(token);
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        if (email == null || email.isEmpty()) {
            throw new UsernameNotFoundException("User not found");
        }
        return userRepository.findByEmail(email)
                .map(user -> {
                    Set<GrantedAuthority> authorities = new HashSet<>();
                    RoleGroup roleGroup = user.getRoleGroup();
                    if (roleGroup != null) {
                        roleGroup.getRoles().forEach(role -> {
                            authorities.add(new SimpleGrantedAuthority(role.getName()));
                        });
                    }
                    return new org.springframework.security.core.userdetails.User(
                            user.getEmail(),
                            user.getPassword(),
                            authorities
                    );
                })
                .orElseThrow(() -> new UsernameNotFoundException("Failed to retrieve user:" + email));
    }

    @Transactional
    public boolean emailConfirmation(String token) {
        User userByToken = userRepository.findByEmailVerificationToken(token)
                .orElseThrow(() -> new UserEmailNotFoundException("Email verification token not found"));

        String storedToken = redisClient.get(userByToken.getEmail() + ":activationToken");
        if (storedToken == null) {
            log.error("Token has expired or does not exist in Redis: {}", token);
            throw new TokenException("Email verification has expired. Please resend the activation message to your email address.");
        }

        if (!storedToken.equals(token)) {
            log.error("Token mismatch: expected {} but found {}", token, storedToken);
            throw new TokenException("Email verification has expired. Please resend the activation message to your email address.");
        }

        redisClient.delete(userByToken.getEmail() + ":activationToken");

        userByToken.setEmailVerificationToken(null);
        userByToken.setIsVerified(true);
        RoleGroup roleGroup = roleGroupRepository.findByName("VERIFIED_USER")
                .orElseThrow(() -> new RoleGroupNotFoundException("Group not found"));
        userByToken.setRoleGroup(roleGroup);

        userRepository.saveAndFlush(userByToken);
        log.info("User {} has been verified", userByToken.getEmail());
        return true;
    }

    @Transactional
    public void resendEmailConfirmation() {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with email: " + securityContext() + " not found"));

        if (user.getIsVerified()) {
            throw new UserAlreadyVerifiedException("User is already verified");
        }

        String activationToken = UUID.randomUUID().toString();

        String confirmationLink = "http://localhost:8765/auth/activate?token=" + activationToken;
        notificationFeignClient.sendEmail(new EmailRequest(
                user.getEmail(),
                "Confirm your email",
                "You have got a new email verification link to activate your account." +
                        " Please click the link below to confirm your email address and complete your registration: " + confirmationLink
        ));

        log.info("Email: {}, Body: {}",
                user.getEmail(),
                "You have got a new email verification link to activate your account." +
                        " Please click the link below to confirm your email address and complete your registration: " + confirmationLink);

        redisClient.set(user.getEmail() + ":activationToken", activationToken, 1, TimeUnit.DAYS);

        user.setEmailVerificationToken(activationToken);
        userRepository.saveAndFlush(user);
    }

    @Transactional
    public void delete(UserDeleteDto userDeleteDto) {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with email: " + securityContext() + " not found"));

        if (!passwordEncoder.matches(userDeleteDto.getPassword(), user.getPassword())) {
            throw new InvalidPasswordException("The provided password is incorrect.");
        }

        redisClient.delete("whitelist:" + user.getEmail() + ":accessToken");
        redisClient.delete("whitelist:" + user.getEmail() + ":refreshToken");

        userRepository.delete(user);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with id: " + " not found"));

        redisClient.delete("whitelist:" + user.getEmail() + ":accessToken");
        redisClient.delete("whitelist:" + user.getEmail() + ":refreshToken");

        userRepository.delete(user);
    }

    @Transactional
    public void changeUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User with id: " + " not found"));

        RoleGroup roleGroupToSet = roleGroupRepository.findByName(role.toUpperCase())
                .orElseThrow(() -> new RoleGroupNotFoundException("Group not found"));

        if (roleGroupToSet.getName().equals(user.getRoleGroup().getName())) {
            throw new UserAlreadyHasRoleException("User already has " + role + " role");
        }

        if (role.equals("USER")) {
            user.setIsVerified(false);
        }
        user.setRoleGroup(roleGroupToSet);

        userRepository.saveAndFlush(user);
    }

    @Transactional
    public void changePassword(UserChangePasswordDto userChangePasswordDto) {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with e  mail: " + securityContext() + " not found"));

        if(passwordEncoder.matches(userChangePasswordDto.getOldPassword(), user.getPassword())) {
            if (!userChangePasswordDto.getOldPassword().equals(userChangePasswordDto.getNewPassword())) {
                user.setPassword(passwordEncoder.encode(userChangePasswordDto.getNewPassword()));

                redisClient.delete("whitelist:" + user.getEmail() + ":accessToken");
                redisClient.delete("whitelist:" + user.getEmail() + ":refreshToken");

            } else {
                throw new InvalidPasswordException("The new password cannot be the same as the old password.");
            }
        } else {
            throw new InvalidPasswordException("The provided old password is incorrect.");
        }
    }

    @Transactional
    public UserReadDto changeUserPersonalData(UserPersonalDataDto userPersonalDataDto) {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with email: " + securityContext() + " not found"));

        if (userPersonalDataDto.getUsername() != null
                && !userPersonalDataDto.getUsername().equals(user.getUsername())
                && userRepository.existsByUsername(userPersonalDataDto.getUsername())) {
            throw new UserAlreadyExistsException("Username already exists");
        }

        Optional.ofNullable(userPersonalDataDto.getUsername()).ifPresent(user::setUsername);
        Optional.ofNullable(userPersonalDataDto.getFirstName()).ifPresent(user::setFirstName);
        Optional.ofNullable(userPersonalDataDto.getLastName()).ifPresent(user::setLastName);
        Optional.ofNullable(userPersonalDataDto.getBirthDate()).ifPresent(user::setBirthDate);

        User updatedUser = userRepository.saveAndFlush(user);
        return userMapper.toDto(updatedUser);
    }

    public UserReadDto getUserByEmail() {
        String email = securityContext();
        return userRepository.findByEmail(email)
                .map(userMapper::toDto)
                .orElseThrow(() -> new UserEmailNotFoundException("User with email: " + email + " not found"));
    }

    public UserPublicProfileDto getUserPublicProfileByUsername(String username) {
        return userRepository.findByUsername(username)
                .map(userMapper::toPublicProfileDto)
                .orElseThrow(() -> new UserEmailNotFoundException("User with username: " + username + " not found"));
    }

    public RoleGroup getRoleGroupByEmail() {
        String email = securityContext();
         return roleGroupRepository.findRoleGroupByEmailWithRoles(email);
    }

    public List<User> searchUser(String keyword) {
        return userRepository.searchUser(keyword);
    }

    private String securityContext() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }

}
