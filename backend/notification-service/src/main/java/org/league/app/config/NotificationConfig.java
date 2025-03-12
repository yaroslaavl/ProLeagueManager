package org.league.app.config;

import lombok.SneakyThrows;
import org.league.app.filter.JWTFilter;
import org.league.app.filter.RouteFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.context.SecurityContextHolderFilter;

@Configuration
@EnableScheduling
@EnableWebSecurity
public class NotificationConfig {

    private final JWTFilter jwtFilter;
    private final RouteFilter routeFilter;

    public NotificationConfig(JWTFilter jwtFilter, RouteFilter routeFilter) {
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
                                "/api/my-notifications/subscribeToNotification",
                                "/api/my-notifications/subscriptionList",
                                "/api/my-notifications/get-all-notifications",
                                "/api/my-notifications/send-notification",
                                "/api/notification/send-email-with-qr-code",
                                "/api/my-notifications/get-team/*",
                                "/api/my-notifications/team-join-request/**",
                                "/api/my-notifications/team/**"
                        ).authenticated()
                        .requestMatchers(
                                "/actuator/health",
                                "/api/my-notifications/subscribe/**",
                                "/api/notification/send-email").permitAll()
                )
                .addFilterBefore(routeFilter, SecurityContextHolderFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        return httpSecurity.build();
    }

}
