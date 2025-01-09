package org.league.app.filter;

import lombok.extern.slf4j.Slf4j;
import org.league.app.util.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

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

            log.info("Request path: {}", path);

            var authHeader = exchange.getRequest().getHeaders().get("Authorization");

            if (authHeader == null || !authHeader.getFirst().startsWith("Bearer ")) {
               return chain.filter(exchange);
            }
            String substring = authHeader.getFirst().substring(7);
            log.info("Extracted token: {}", authHeader);

            try {
                jwtUtil.validatedToken(substring);
                log.info("Token is valid");
            } catch (Exception e) {
                log.error("Invalid token");
                return Mono.just(exchange.getResponse())
                        .flatMap(response -> {
                            response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
                            return response.setComplete();
                        });
            }

            return chain.filter(exchange);
        }));
    }

    public static class Config {

    }
}
