package org.league.app.config;

import lombok.SneakyThrows;
import org.league.app.filter.JWTFilter;
import org.league.app.filter.RouteFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;

@Configuration
public class FeedbackConfig {

    private final JWTFilter jwtFilter;
    private final RouteFilter routeFilter;

    public FeedbackConfig(JWTFilter jwtFilter, RouteFilter routeFilter) {
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
                                        "/actuator/health").permitAll()
                                .requestMatchers("/api/feedback/create/*",
                                        "/api/feedback/edit/*",
                                        "/api/feedback/delete/*",
                                        "/api/feedback/like/*").authenticated()
                                .requestMatchers("/api/feedback/interval/*").hasAuthority("MODERATOR")
                )
                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return http.build();
    }
}