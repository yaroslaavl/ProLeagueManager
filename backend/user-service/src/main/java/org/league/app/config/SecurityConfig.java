package org.league.app.config;

import jakarta.servlet.http.HttpServletResponse;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.repository.RoleGroupRepository;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.UserCreateDto;
import org.league.app.exception.RoleGroupNotFound;
import org.league.app.filter.JWTFilter;
import org.league.app.filter.RouteFilter;
import org.league.app.mapper.UserMapper;
import org.league.app.rediscache.RedisCacheClient;
import org.league.app.service.JWTService;
import org.league.app.service.UserService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;

import java.util.Random;
import java.util.concurrent.TimeUnit;

@Slf4j
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JWTFilter jwtFilter;
    private final UserService userService;
    private final UserRepository userRepository;
    private final RoleGroupRepository roleGroupRepository;
    private final UserMapper userMapper;
    private final RedisCacheClient redisCacheClient;
    private final JWTService jwtService;
    private final RouteFilter routeFilter;

    public SecurityConfig(@Lazy JWTFilter jwtFilter, @Lazy UserService userService, UserRepository userRepository, RoleGroupRepository roleGroupRepository, UserMapper userMapper, RedisCacheClient redisCacheClient, @Lazy JWTService jwtService, RouteFilter routeFilter) {
        this.jwtFilter = jwtFilter;
        this.userService = userService;
        this.userRepository = userRepository;
        this.roleGroupRepository = roleGroupRepository;
        this.userMapper = userMapper;
        this.redisCacheClient = redisCacheClient;
        this.jwtService = jwtService;
        this.routeFilter = routeFilter;
    }

    @Bean
    @SneakyThrows
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) {
        httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/auth/login",
                                "/api/auth/registration",
                                "/api/auth/activate",
                                "/api/auth/refresh-token",
                                "/api/user/profile/public/**",
                                "/api/user/avatar/**",
                                "/api/user/allUsers",
                                "/api/auth/extract-email",
                                "/api/user/send-reset-password",
                                "/api/user/set-new-password/**",
                                "/api/user/change-user-password",
                                "/api/auth/get-token",
                                "/api/auth/is-access-token",
                                "/api/auth/load-user-by-email",
                                "/api/auth/validate-token",
                                "/actuator/health",
                                "/api/auth/get-user-by-email").permitAll()
                        .requestMatchers("/api/auth/logout").authenticated()
                        .anyRequest().authenticated()
                )
                .oauth2Login(oauth2 -> oauth2
                        .userInfoEndpoint(userInfo -> userInfo.oidcUserService(oidcUserService()))
                        .successHandler((request, response, authentication) -> {
                           try{ String email = ((OidcUser) authentication.getPrincipal()).getEmail();
                            String accessToken = redisCacheClient.get("whitelist:" + email + ":accessToken");
                            String refreshToken = redisCacheClient.get("whitelist:" + email + ":refreshToken");

                            response.sendRedirect("http://localhost:3000/callback?accessToken=" + accessToken + "&refreshToken=" + refreshToken);
                           } catch (Exception e) {
                               log.error(e.getMessage());
                               response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
                           }
                        })
                )
                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return httpSecurity.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    @SneakyThrows
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) {
        return configuration.getAuthenticationManager();
    }

    private OAuth2UserService<OidcUserRequest, OidcUser> oidcUserService() {
        return userRequest -> {

            String email = userRequest.getIdToken().getClaim("email");

            if (!userRepository.existsByEmail(email)) {
                String username = "User" + (100000 + new Random().nextInt(900000));
                while (userRepository.existsByUsername(username)) {
                    username = "User" + (100000 + new Random().nextInt(900000));
                }

                String fullName = userRequest.getIdToken().getFullName();
                String[] parts = fullName.split(" ");
                String firstName = parts.length > 0 ? parts[0] : "Unknown";
                String lastName = parts.length > 1 ? parts[1] : "";

                UserCreateDto user = UserCreateDto.builder()
                        .username(username)
                        .email(email)
                        .password(passwordEncoder().encode("hVapiNM3cu@lks"))
                        .firstName(firstName)
                        .lastName(lastName)
                        .birthDate(null)
                        .roleGroup(roleGroupRepository.findByName("VERIFIED_USER").orElseThrow(() -> new RoleGroupNotFound("Group not found")))
                        .isVerified(true)
                        .emailVerificationToken(null)
                        .build();

                userRepository.save(userMapper.toEntity(user, passwordEncoder()));
            }

            UserDetails userDetails = userService.loadUserByUsername(email);
            Authentication authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);

            String accessToken = jwtService.generateToken(authentication);
            String refreshToken = jwtService.generateRefreshToken(authentication);

            redisCacheClient.set("whitelist:" + email + ":accessToken", accessToken, 15, TimeUnit.MINUTES);
            redisCacheClient.set("whitelist:" + email + ":refreshToken", refreshToken, 1, TimeUnit.DAYS);

            return new DefaultOidcUser(userDetails.getAuthorities(), userRequest.getIdToken());
        };
    }

}
