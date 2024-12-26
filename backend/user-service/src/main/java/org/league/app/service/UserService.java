package org.league.app.service;

import lombok.RequiredArgsConstructor;
import org.league.app.exception.*;
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
import org.league.app.rediscache.RedisCacheClient;
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
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final RoleGroupRepository roleGroupRepository;
    private final NotificationFeignClient notificationFeignClient;
    private final RedisCacheClient redisCacheClient;

    @Value("${app.image.uploadDir}")
    private String uploadDir;

    @Transactional
    public UserReadDto create(UserCreateDto userCreateDto){
        String activationToken = UUID.randomUUID().toString();
        RoleGroup userRoleGroup = roleGroupRepository.findByName("USER")
                .orElseThrow(() -> new RoleGroupNotFound("Group not found"));

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

        redisCacheClient.set(newUser.getEmail() + ":activationToken", activationToken, 1, TimeUnit.DAYS);

        log.info("Email: {}, Subject: {}, Body: {}",
                userCreateDto.getEmail(),
                "Confirm your email",
                "Click the link to confirm your account: " + confirmationLink);

        return userMapper.toDto(newUser);
    }

    public boolean sendPasswordResetEmail(EmailResetPasswordDto emailResetPasswordDto) {
        if (emailResetPasswordDto.getEmail() == null || !userRepository.existsByEmail(emailResetPasswordDto.getEmail())) {
            throw new UsernameNotFoundException("User not found");
        }

        String resetToken = UUID.randomUUID().toString();
        String resetUrl = "http://localhost:8765/auth/reset-password?token=" + resetToken;

        try {
            notificationFeignClient.sendEmail(new EmailRequest(
                    emailResetPasswordDto.getEmail(),
                    "Password Reset Request",
                    "Click the link to reset your password: " + resetUrl
            ));

            redisCacheClient.set(emailResetPasswordDto.getEmail() + ":resetPasswordToken", resetToken, 5, TimeUnit.MINUTES);
            redisCacheClient.set(resetToken, emailResetPasswordDto.getEmail(), 5,TimeUnit.MINUTES);

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

        String userEmail = redisCacheClient.get(token);
        if (userEmail == null) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        String storedToken = redisCacheClient.get(userEmail + ":resetPasswordToken");
        if (storedToken == null || !storedToken.equals(token)) {
            throw new IllegalArgumentException("Invalid or expired token");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new UserEmailNotFoundException("User not found"));

        user.setPassword(passwordEncoder.encode(resetPasswordDto.getNewPassword()));
        userRepository.save(user);

        redisCacheClient.delete(userEmail + ":resetPasswordToken");
        redisCacheClient.delete(token);
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
                .orElseThrow(() -> new UsernameNotFoundException("Email verification token not found"));

        String storedToken = redisCacheClient.get(userByToken.getEmail() + ":activationToken");
        if (storedToken == null) {
            log.error("Token has expired or does not exist in Redis: {}", token);
            throw new TokenException("Email verification has expired. Please resend the activation message to your email address.");
        }

        if (!storedToken.equals(token)) {
            log.error("Token mismatch: expected {} but found {}", token, storedToken);
            throw new TokenException("Email verification has expired. Please resend the activation message to your email address.");
        }

        redisCacheClient.delete(userByToken.getEmail() + ":activationToken");

        userByToken.setEmailVerificationToken(null);
        userByToken.setIsVerified(true);
        RoleGroup roleGroup = roleGroupRepository.findByName("VERIFIED_USER")
                .orElseThrow(() -> new RoleGroupNotFound("Group not found"));
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
            throw new UserAlreadyVerified("User is already verified");
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

        redisCacheClient.set(user.getEmail() + ":activationToken", activationToken, 1, TimeUnit.DAYS);

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

        redisCacheClient.delete("whitelist:" + user.getEmail() + ":accessToken");
        redisCacheClient.delete("whitelist:" + user.getEmail() + ":refreshToken");

        userRepository.delete(user);
    }

    @Transactional
    public void changePassword(UserChangePasswordDto userChangePasswordDto) {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with e  mail: " + securityContext() + " not found"));

        if(passwordEncoder.matches(userChangePasswordDto.getOldPassword(), user.getPassword())){
            if(!userChangePasswordDto.getOldPassword().equals(userChangePasswordDto.getNewPassword())){
                user.setPassword(passwordEncoder.encode(userChangePasswordDto.getNewPassword()));

                redisCacheClient.delete("whitelist:" + user.getEmail() + ":accessToken");
                redisCacheClient.delete("whitelist:" + user.getEmail() + ":refreshToken");

            } else {
                throw new InvalidPasswordException("The new password cannot be the same as the old password.");
            }
        }
    }

    @Transactional
    public UserReadDto changeUserPersonalData(UserPersonalDataDto userPersonalDataDto) {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with email: " + securityContext() + " not found"));

        if (userPersonalDataDto.getUsername() != null
                && !userPersonalDataDto.getUsername().equals(user.getUsername())
                && userRepository.existsByUsername(userPersonalDataDto.getUsername())) {
            throw new UserAlreadyVerified("Username already exists");
        }

        Optional.ofNullable(userPersonalDataDto.getUsername()).ifPresent(user::setUsername);
        Optional.ofNullable(userPersonalDataDto.getFirstName()).ifPresent(user::setFirstName);
        Optional.ofNullable(userPersonalDataDto.getLastName()).ifPresent(user::setLastName);
        Optional.ofNullable(userPersonalDataDto.getBirthDate()).ifPresent(user::setBirthDate);

        User updatedUser = userRepository.saveAndFlush(user);
        return userMapper.toDto(updatedUser);
    }

    @Transactional
    public String uploadAvatar(ImageUploadDto imageUploadDto) throws IOException {
        User user = userRepository.findByEmail(securityContext())
                .orElseThrow(() -> new UserEmailNotFoundException("User with email: " + securityContext() + " not found"));

        MultipartFile file = imageUploadDto.getAvatar();

        if (file != null && !file.isEmpty()) {
            String extension = Objects.requireNonNull(file.getOriginalFilename()).substring(file.getOriginalFilename().lastIndexOf("."));
            String filename = user.getEmail() + "_avatar" + extension;

            Path path = Paths.get(uploadDir, filename);

            if (Files.exists(path)) {
                Files.delete(path);
            }

            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            Files.write(path, file.getBytes());

            user.setAvatar(filename);
            userRepository.save(user);

            return filename;
        }

        return null;
    }

    public byte[] getUserImage(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserEmailNotFoundException("User with username: " + username + " not found"));

        if (user.getAvatar() != null) {
            Path path = Paths.get(uploadDir, user.getAvatar());
            try {

                return Files.readAllBytes(path);
            } catch (IOException e) {
                log.error("Failed to read user image: {}", e.getMessage());
            }
        }
         return getDefaultImage();
    }

    private byte[] getDefaultImage() {
        Path defaultImagePath = Paths.get("E:/important/league-hub/backend/images/user_avatar/default-avatar.jpg");
        try {
            return Files.readAllBytes(defaultImagePath);
        } catch (IOException e) {
            log.error("Failed to load default avatar: {}", e.getMessage());
            return new byte[0];
        }
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

    private String securityContext() {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    }
}
