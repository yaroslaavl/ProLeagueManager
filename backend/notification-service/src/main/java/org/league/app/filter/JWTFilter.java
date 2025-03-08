package org.league.app.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.league.app.feign.AuthClientFeign;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;

@Slf4j
@Component
public class JWTFilter extends OncePerRequestFilter {

    private final AuthClientFeign authClientFeign;

    public JWTFilter(AuthClientFeign authClientFeign) {
        this.authClientFeign = authClientFeign;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/actuator/health")
                || path.equals("/api/notification/send-email")
                || path.startsWith("/api/my-notifications/subscribe/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Missing or invalid Authorization header\"}");
            return;
        }

        String jwtToken = authorizationHeader.substring(7);
        String email;

        try {
            email = authClientFeign.extractEmail(authorizationHeader, jwtToken);
            log.info("Extracted email: {}", email);
        } catch (Exception e) {
            log.error("Failed to extract email from token", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid or expired JWT token: " + jwtToken);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            log.info("User email: {}", email);
            var userDetails = authClientFeign.loadUserByEmail(authorizationHeader, email);

            if(authClientFeign.validateToken(authorizationHeader, jwtToken, userDetails.getEmail()) && authClientFeign.isAccessToken(authorizationHeader, jwtToken) &&
                    authClientFeign.getToken(
                            "whitelist:" + userDetails.getEmail() + ":accessToken").equals(jwtToken)) {
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getRoles().stream()
                        .map(SimpleGrantedAuthority::new)
                        .toList());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.getWriter().write("Invalid token");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
