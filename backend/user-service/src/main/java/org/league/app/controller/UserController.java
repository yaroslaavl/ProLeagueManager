package org.league.app.controller;

import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.RoleGroup;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.*;
import org.league.app.mapper.UserMapper;
import org.league.app.redisclient.RedisClient;
import org.league.app.service.MinioService;
import org.league.app.service.UserService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final RedisClient redisClient;
    private final MinioService minioService;

    @DeleteMapping("/delete-user-account")
    public ResponseEntity<?> deleteUser(@RequestBody @Validated({EditAction.class}) UserDeleteDto userDeleteDto) {
        userService.delete(userDeleteDto);
        return ResponseEntity.ok("User account deleted successfully");
    }

    @PutMapping("/change-user-password")
    public ResponseEntity<?> changePassword(@RequestBody @Validated({EditAction.class}) UserChangePasswordDto userChangePasswordDto) {
        userService.changePassword(userChangePasswordDto);
        return ResponseEntity.ok("You changed the password. Please login again.");
    }

    @PutMapping("/update-user-personal-data")
    public ResponseEntity<UserReadDto> updatePersonalData(@RequestBody @Validated({EditAction.class}) UserPersonalDataDto userPersonalDataDto) {
        UserReadDto user = userService.changeUserPersonalData(userPersonalDataDto);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/profile")
    public ResponseEntity<UserReadDto> getProfile() {
        return ResponseEntity.ok(userService.getUserByEmail());
    }

    @GetMapping("/allUsers")
    public Page<UserReadDto> findAllUsers(@RequestParam("page") int page,
                                   @RequestParam("size") int size,
                                   Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toDto);
    }

    @GetMapping("/profile/public/{username}")
    public ResponseEntity<UserPublicProfileDto> getPublicProfile(@PathVariable("username") String username) {
        return ResponseEntity.ok(userService.getUserPublicProfileByUsername(username));
    }

    @GetMapping("/role-group")
    public ResponseEntity<RoleGroup> getRoleGroup() {
        return ResponseEntity.ok(userService.getRoleGroupByEmail());
    }

    @PostMapping("/upload-user-avatar")
    public void uploadAvatar(@ModelAttribute @Validated({CreateAction.class, EditAction.class}) ImageUploadDto imageUploadDto) throws IOException {
        minioService.uploadImage(imageUploadDto);
    }

    @GetMapping("/avatar/{username}")
    public ResponseEntity<String> getUserImage(@PathVariable("username") String username) {
        return ResponseEntity.ok(minioService.getUserAvatar(username));
    }

    @PostMapping("/resend-activation-email")
    public ResponseEntity<String> resendActivationEmail() {
        userService.resendEmailConfirmation();
        return ResponseEntity.ok("Resend activation email has been sent");
    }

    @PostMapping("/send-reset-password")
    public ResponseEntity<String> sendResetPasswordEmail(@RequestBody EmailResetPasswordDto emailResetPasswordDto) {
        boolean success = userService.sendPasswordResetEmail(emailResetPasswordDto);
        if (success) {
            return ResponseEntity.ok().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/reset-password/{token}")
    public ResponseEntity<String> setNewPassword(@PathVariable("token") String token,
                                                 @RequestBody @Validated(EditAction.class) ResetPasswordDto resetPasswordDto) {
        try {
            userService.resetPassword(resetPasswordDto, token);
            return ResponseEntity.ok("Your password has been changed");
        } catch (IllegalArgumentException e){
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @SneakyThrows
    @GetMapping("/reset-password-check/{token}")
    public ResponseEntity<Void> handleResetPassword(@PathVariable("token") String token, HttpServletResponse response) {
        String resetToken = redisClient.get(token);

        if (resetToken == null) {
            response.sendRedirect("http://localhost:63342/ProLeagueManager/frontend/404.html");
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        response.sendRedirect("http://localhost:63342/ProLeagueManager/frontend/resetPassword.html?token=" + token);
        return new ResponseEntity<>(HttpStatus.FOUND);
    }

    @GetMapping("/search-user")
    public ResponseEntity<List<UserReadDto>> searchUsers(@RequestParam("keyword") String keyword) {
        if (keyword.isEmpty()){
            return new ResponseEntity<>(null, HttpStatus.OK);
        }

        List<UserReadDto> users = userService.searchUser(keyword)
                .stream().map(userMapper::toDto).collect(Collectors.toList());
        return new ResponseEntity<>(users, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserReadDto> getUser(@PathVariable("id") Long id) {
        return ResponseEntity.ok(userService.getUser(id));
    }
}

