package org.league.app.config;

import lombok.SneakyThrows;
import org.league.app.filter.JWTFilter;
import org.league.app.filter.RouteFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;

@Configuration
@EnableWebSecurity
public class TeamConfig {

    private final JWTFilter jwtFilter;
    private final RouteFilter routeFilter;

    public TeamConfig(JWTFilter jwtFilter, RouteFilter routeFilter) {
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
                                "/api/team/create-team",
                                "/api/team/join-accept/**").hasAuthority("AUTHORISED_USER")
                        .requestMatchers(
                                "/api/team/update-team-name/**",
                                "/api/team/delete/**",
                                "/api/team/upload-team-logo/**",
                                "/api/team/invite/**",
                                "/api/team/revoke-join-request/**",
                                "/api/team/user-deletion/**",
                                "/api/team/leave/**",
                                "/api/team/join-reject/**",
                                "/api/team/update-role/**").authenticated()
                        .requestMatchers("/api/team/allTeams",
                                "/api/team/currentTeam/**",
                                "/actuator/health",
                                "/api/team/*/user-role",
                                "/api/team/team-logo/**",
                                "/api/team/get-team-member-by-team-and-userId",
                                "/api/team/get-teams-by-userId",
                                "/api/team/get-all-teamRoles",
                                "/api/team/current/**",
                                "/api/team/managed",
                                "/api/team/search-team").permitAll())

                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return httpSecurity.build();
    }
}
