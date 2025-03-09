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
public class MatchConfig {

    private final JWTFilter jwtFilter;
    private final RouteFilter routeFilter;

    public MatchConfig(JWTFilter jwtFilter, RouteFilter routeFilter) {
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
                                "/api/match/leagueTours/**",
                                "/api/match/tourMatches/**",
                                "/api/match/dynamic-all/**",
                                "/api/match/grouped-by-stage/*",
                                "/api/match/upcoming-top",
                                "/api/match/id/**").permitAll()
                        .requestMatchers(
                                "/api/match/confirmation").authenticated()
                        .requestMatchers(
                                "/api/match/qr-review",
                                "/api/match/*/score").hasAuthority("EDITOR")
                        )
                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}
