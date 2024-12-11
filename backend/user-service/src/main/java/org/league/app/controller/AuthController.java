package org.league.app.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.AuthResponseDto;
import org.league.app.dto.LoginDto;
import org.league.app.dto.UserCreateDto;
import org.league.app.dto.UserReadDto;
import org.league.app.rediscache.RedisCacheClient;
import org.league.app.service.JWTService;
import org.league.app.service.UserService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final JWTService jwtService;
    private final UserService userService;
    private final UserRepository userRepository;
    private final RedisCacheClient redisCacheClient;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/registration")
    public ResponseEntity<UserReadDto> registration(@RequestBody @Validated({CreateAction.class, EditAction.class}) UserCreateDto userCreateEditDto, BindingResult bindingResult){
        if(userRepository.existsByEmail(userCreateEditDto.getEmail()) && userRepository.existsByUsername(userCreateEditDto.getUsername())){
            log.error("'{}' is already registered",userCreateEditDto.getEmail());
            log.error("'{}' is already in use",userCreateEditDto.getUsername());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        if(userRepository.existsByEmail(userCreateEditDto.getEmail()) || userRepository.existsByUsername(userCreateEditDto.getUsername())){
            log.error("'{}' is already exist",
                    userRepository.existsByEmail(userCreateEditDto.getEmail()) ? userCreateEditDto.getEmail() : userCreateEditDto.getUsername());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        if(bindingResult.hasErrors()){
            bindingResult.getFieldErrors().forEach(fieldError -> log.error(fieldError.getField() + ": " + fieldError.getDefaultMessage()));
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        var userReadDto = userService.create(userCreateEditDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(userReadDto);
    }

    @PostMapping("/login")
    public AuthResponseDto login(@RequestBody LoginDto loginDto){
        Authentication authenticate = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                loginDto.getEmail(),
                loginDto.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authenticate);
        String accessToken = jwtService.generateToken(authenticate);
        String refreshToken = jwtService.generateRefreshToken(authenticate);
        log.info("accessToken token: {}", accessToken);
        log.info("refreshToken token: {}", refreshToken);
        redisCacheClient.set(
                "whitelist:" + loginDto.getEmail() + ":accessToken", accessToken, 3, TimeUnit.MINUTES);
        redisCacheClient.set(
                "whitelist:" + loginDto.getEmail() + ":refreshToken", refreshToken, 7, TimeUnit.DAYS);
        return AuthResponseDto.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @PostMapping("/logout")
    public ResponseEntity<String> logout(@RequestHeader("Authorization") String token){
        log.info("Logout endpoint reached with method POST");

        String subToken = token.substring(7);
        String extractedUsername = jwtService.extractEmail(subToken);

        redisCacheClient.delete("whitelist:" + extractedUsername + ":accessToken");
        redisCacheClient.delete("whitelist:" + extractedUsername + ":refreshToken");

        return ResponseEntity.ok("Logout successful");
    }

    @PostMapping("/refresh-token")
    public void refreshToken(HttpServletResponse response, HttpServletRequest request) throws IOException {
        jwtService.generateRefreshToken(request,response);
    }

    @GetMapping("/activate")
    public ResponseEntity<Boolean> activate(@RequestParam("token") String token){
        boolean confirmation = userService.emailConfirmation(token);
        log.info("'{}' is activated",token);
        return ResponseEntity.ok(confirmation);
    }
}
