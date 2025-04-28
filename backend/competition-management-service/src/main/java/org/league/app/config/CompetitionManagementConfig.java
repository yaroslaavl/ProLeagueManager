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
public class CompetitionManagementConfig {

    private final JWTFilter jwtFilter;
    private final RouteFilter routeFilter;

    public CompetitionManagementConfig(JWTFilter jwtFilter, RouteFilter routeFilter) {
        this.jwtFilter = jwtFilter;
        this.routeFilter = routeFilter;
    }

    @Bean
    @SneakyThrows
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity) {
        httpSecurity
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/actuator/**",
                                "/actuator",
                                "/api/competition/search-leagues",
                                "/api/competition/get/**",
                                "/api/competition/all",
                                "/api/competition/search-tournaments",
                                "/api/competition/players/**",
                                "/api/competition/active-competitions",
                                "/api/competition/last-day-active-leagues",
                                "/api/competition/count-of-signed-in",
                                "/api/competition/standings",
                                "/api/competition/league-table/**",
                                "/api/competition/update-standing",
                                "/api/competition/user",
                                "/api/competition/team",
                                "/api/competition/stages",
                                "/api/competition/get-image/*",
                                "/api/competition/update-standing",
                                "/api/competition/closest-tournaments",
                                "/api/competition/closest-leagues",
                                "/api/competition/top-stages",
                                "/api/game-system/get/*",
                                "/api/competition/participants/*").permitAll()
                        .requestMatchers(
                                "/api/competition/create",
                                "/api/competition/edit/**",
                                "/api/competition/delete",
                                "/api/game-system/create",
                                "/api/game-system/delete/**",
                                "/api/game-system/search",
                                "/api/game-system/get-all",
                                "/api/game-system/update/**",
                                "/api/competition/upload-image/*",
                                "/api/competition/disqualify/*").hasAuthority("MODERATOR")
                        .requestMatchers(
                                "/api/competition/participation").authenticated())
                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        return httpSecurity.build();
    }
}
