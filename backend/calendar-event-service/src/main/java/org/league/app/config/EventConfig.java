package org.league.app.config;

import lombok.SneakyThrows;
import org.league.app.filter.JWTFilter;
import org.league.app.filter.RouteFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;

@Configuration
@EnableScheduling
public class EventConfig {

    private final JWTFilter jwtFilter;
    private final RouteFilter routeFilter;

    public EventConfig(JWTFilter jwtFilter, RouteFilter routeFilter) {
        this.jwtFilter = jwtFilter;
        this.routeFilter = routeFilter;
    }

    @Bean
    @SneakyThrows
    public SecurityFilterChain configure(HttpSecurity http) {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(
                        authorizeRequests -> authorizeRequests
                                .requestMatchers(
                                        "/actuator/health",
                                        "/api/event/published",
                                        "/api/event/pinned",
                                        "/api/event/image/*",
                                        "/api/event/id/*").permitAll()
                                .requestMatchers(
                                        "/api/event/upload-pinned-image/*",
                                        "/api/event/all",
                                        "/api/event/pinned/*",
                                        "/api/event/pinned").hasAuthority("MODERATOR")
                )
                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}