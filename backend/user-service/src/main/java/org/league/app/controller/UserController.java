package org.league.app.controller;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.RoleGroup;
import org.league.app.database.entity.User;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.*;
import org.league.app.exception.UserEmailNotFoundException;
import org.league.app.service.UserService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;


@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

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

    @GetMapping("/profile/public/{username}")
    public ResponseEntity<UserPublicProfileDto> getPublicProfile(@PathVariable("username") String username) {
        return ResponseEntity.ok(userService.getUserPublicProfileByUsername(username));
    }

    @GetMapping("/role-group")
    public ResponseEntity<RoleGroup> getRoleGroup() {
        return ResponseEntity.ok(userService.getRoleGroupByEmail());
    }

    @PostMapping("/upload-user-avatar")
    public ResponseEntity<String> uploadAvatar(@ModelAttribute @Validated({CreateAction.class, EditAction.class}) ImageUploadDto imageUploadDto) throws IOException {
        return ResponseEntity.ok(userService.uploadAvatar(imageUploadDto));
    }

    @GetMapping("/avatar/{username}")
    public ResponseEntity<byte[]> getUserImage(@PathVariable("username") String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UserEmailNotFoundException("User with username: " + username + " not found"));

        byte[] imageBytes = userService.getUserImage(username);

        if (imageBytes != null) {
            String avatar = user.getAvatar();
            String contentType = "image/" + avatar.substring(avatar.lastIndexOf(".") + 1);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(imageBytes);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/resend-activation-email")
    public ResponseEntity<String> resendActivationEmail() {
        userService.resendEmailConfirmation();
        return ResponseEntity.ok("Resend activation email has been sent");
    }

}

