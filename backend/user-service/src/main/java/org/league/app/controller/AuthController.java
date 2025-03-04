package org.league.app.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Role;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.AuthResponseDto;
import org.league.app.dto.LoginDto;
import org.league.app.dto.UserCreateDto;
import org.league.app.dto.UserReadDto;
import org.league.app.exception.UserEmailNotFoundException;
import org.league.app.feign.UserDto;
import org.league.app.redisclient.RedisClient;
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
import java.net.URI;
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
    private final RedisClient redisClient;
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
            bindingResult.getFieldErrors().forEach(fieldError -> log.error("{}: {}", fieldError.getField(), fieldError.getDefaultMessage()));
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
        redisClient.set(
                "whitelist:" + loginDto.getEmail() + ":accessToken", accessToken, 15, TimeUnit.MINUTES);
        redisClient.set(
                "whitelist:" + loginDto.getEmail() + ":refreshToken", refreshToken, 1, TimeUnit.DAYS);
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

        redisClient.delete("whitelist:" + extractedUsername + ":accessToken");
        redisClient.delete("whitelist:" + extractedUsername + ":refreshToken");

        return ResponseEntity.ok("Logout successful");
    }

    @PostMapping("/refresh-token")
    public void refreshToken(HttpServletResponse response, HttpServletRequest request) throws IOException {
        jwtService.generateRefreshToken(request,response);
    }

    @SneakyThrows
    @GetMapping("/activate")
    public void activate(@RequestParam("token") String token, HttpServletResponse response) {
        boolean confirmation = userService.emailConfirmation(token);

        if (!confirmation) {
            log.info("Activation failed for token '{}'", token);
            response.sendRedirect("http://localhost:63342/ProLeagueManager/frontend/404.html");
            return;
        }
        log.info("'{}' is activated", token);
        response.sendRedirect("http://localhost:63342/ProLeagueManager/frontend/verificationEmail.html");
    }

    @PostMapping("/extract-email")
    public String extractEmail(@RequestHeader("Authorization") String token, @RequestParam("extractToken") String extractToken) {
        return jwtService.extractEmail(extractToken);
    }

    @PostMapping("/validate-token")
    public boolean validateToken(@RequestHeader("Authorization") String token,
                                 @RequestParam("validToken") String validToken,
                                 @RequestParam("email") String email) {
        UserDetails userDetails = userService.loadUserByUsername(email);
        return jwtService.isTokenValid(validToken, userDetails);
    }

    @PostMapping("/is-access-token")
    public boolean isAccessToken(@RequestHeader("Authorization") String token, @RequestParam("accessToken") String accessToken) {
        return jwtService.isAccessToken(accessToken);
    }

    @GetMapping("/get-token")
    public String getToken(@RequestParam("key") String key) {
        return redisClient.get(key);

    }

    @PostMapping("/set-token")
    public String setToken(@RequestParam("key") String key,
                           @RequestParam("value") String value,
                           @RequestParam("timeToLive") long timeToLive,
                           @RequestParam("timeUnit") TimeUnit timeUnit) {
        redisClient.set(key,value,timeToLive,timeUnit);
        return "Token set successfully";
    }

    @PostMapping("/delete-token")
    public String deleteToken(@RequestParam("key") String key) {
        redisClient.delete(key);
        return "Token deleted successfully";
    }

    @GetMapping("/load-user-by-email")
    public UserDto loadUserByEmail(@RequestHeader("Authorization") String token, @RequestParam("email") String email) {
        UserDetails user = userService.loadUserByUsername(email);
        List<String> roles = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
        return UserDto.builder()
                .email(user.getUsername())
                .roles(roles)
                .build();
    }

    @GetMapping("/get-user-by-email")
    public UserDto getUserByEmail(@RequestHeader("Authorization") String token, @RequestParam("email") String email) {
        return userRepository.findByEmail(email)
                .map(user -> new UserDto(user.getId(), user.getEmail(),
                        user.getRoleGroup().getRoles().stream()
                                .map(Role::getName)
                                .collect(Collectors.toList())))
                .orElseThrow(() -> new UserEmailNotFoundException("User not found: " + email));
    }
}
