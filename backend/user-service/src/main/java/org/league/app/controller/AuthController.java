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
import org.league.app.feign.UserDto;
import org.league.app.rediscache.RedisCacheClient;
import org.league.app.service.JWTService;
import org.league.app.service.UserService;
import org.league.app.validation.CreateAction;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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
    public ResponseEntity<UserReadDto> registration(@RequestBody @Validated(CreateAction.class) UserCreateDto userCreate, BindingResult bindingResult){
        if(userRepository.existsByEmail(userCreate.getEmail()) && userRepository.existsByUsername(userCreate.getUsername())){
            log.error("'{}' is already registered",userCreate.getEmail());
            log.error("'{}' is already in use",userCreate.getUsername());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        if(userRepository.existsByEmail(userCreate.getEmail()) || userRepository.existsByUsername(userCreate.getUsername())){
            log.error("'{}' is already exist",
                    userRepository.existsByEmail(userCreate.getEmail()) ? userCreate.getEmail() : userCreate.getUsername());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        if(bindingResult.hasErrors()){
            bindingResult.getFieldErrors().forEach(fieldError -> log.error(fieldError.getField() + ": " + fieldError.getDefaultMessage()));
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        var userReadDto = userService.create(userCreate);
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

    @PostMapping("/extract-email")
    public String extractEmail(@RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        return jwtService.extractEmail(token);
    }

    @PostMapping("/validate-token")
    public boolean validateToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("email") String email) {
        UserDetails userDetails = userService.loadUserByUsername(email);

        return jwtService.isTokenValid(token, userDetails);
    }

    @PostMapping("/is-access-token")
    public boolean isAccessToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token) {
        return jwtService.isAccessToken(token);
    }

    @GetMapping("/get-token")
    public String getToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("key") String key) {
        return redisCacheClient.get(key);

    }

    @GetMapping("/load-user-by-email")
    public UserDto loadUserByEmail(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("email") String email) {
        UserDetails user = userService.loadUserByUsername(email);
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        return UserDto.builder()
                .email(user.getUsername())
                .username(user.getUsername())
                .roles(roles)
                .build();
    }


}
