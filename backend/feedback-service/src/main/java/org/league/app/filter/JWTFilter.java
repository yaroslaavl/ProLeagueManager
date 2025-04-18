package org.league.app.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.league.app.feign.authClient.AuthClientFeign;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

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
        return path.startsWith("/actuator/")
                || path.equals("/actuator")
                || path.equals(("/api/feedback/get-by-competition"));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Missing or invalid Authorization header\"}");
            return;
        }

        String jwtToken = authHeader.substring(7);
        String email;

        try {
            email = authClientFeign.extractEmail(authHeader, jwtToken);
            log.info("Extracted email: {}", email);
        } catch (Exception e) {
            log.error("Failed to extract email from token", e);
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Invalid or expired JWT tokenL: " + jwtToken);
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            log.info("User email: {}", email);
            var userDetails = authClientFeign.loadUserByEmail(authHeader, email);

            if (authClientFeign.validateToken(authHeader, jwtToken, userDetails.getEmail()) && authClientFeign.isAccessToken(authHeader, jwtToken) &&
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