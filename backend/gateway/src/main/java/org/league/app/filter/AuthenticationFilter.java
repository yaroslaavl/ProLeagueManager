package org.league.app.filter;

import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.league.app.util.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class AuthenticationFilter extends AbstractGatewayFilterFactory<AuthenticationFilter.Config> {

    @Autowired
    private JWTUtil jwtUtil;

    public AuthenticationFilter() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (((exchange, chain) -> {
            String path = exchange.getRequest().getURI().getPath();
            for (String excludedPath : config.getExcludedPaths()) {
                if (path.startsWith(excludedPath)) {
                    return chain.filter(exchange);
                }
            }

            if (!exchange.getRequest().getHeaders().containsKey("Authorization")) {
                throw new RuntimeException("Authorization header is missing");
            }

            String authHeader = exchange.getRequest().getHeaders().get("Authorization").get(0);

            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                authHeader = authHeader.substring(7);
                log.info("Extracted token: {}", authHeader);
            }

            try {
                jwtUtil.validatedToken(authHeader);
                log.info("Token is valid");
            } catch (Exception e) {
                log.error("Invalid token");
                throw new RuntimeException("Invalid token");
            }

            return chain.filter(exchange);
        }));
    }

    @Getter
    public static class Config {
        private final List<String> excludedPaths = List.of(
                "/auth/refresh-token",
                "/actuator/health",
                "/auth/registration",
                "/auth/activate",
                "/auth/login",
                "/team/players",
                "/user/profile/public/",
                "/user/avatar/",
                "/sport/allSports",
                "/sport/regular-sports",
                "/sport/e-sports",
                "/sport/exact-sport/"
        );
    }
}
