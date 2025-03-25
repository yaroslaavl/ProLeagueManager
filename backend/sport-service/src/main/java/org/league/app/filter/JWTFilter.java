package org.league.app.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.league.app.feign.AuthClientFeign;
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
        return path.equals("/api/sport/regular-sports")
                || path.equals("/api/sport/e-sports")
                || path.startsWith("/api/sport/exact-sport/")
                || path.equals("/api/sport/allSports")
                || path.equals("/api/sport/get-sports-by-name")
                || path.equals("/api/sport/type-of-sport")
                || path.startsWith("/api/sport/id/")
                || path.startsWith("/actuator/")
                || path.equals("/actuator");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
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

            if (authClientFeign.validateToken(authorizationHeader, jwtToken, userDetails.getEmail()) && authClientFeign.isAccessToken(authorizationHeader, jwtToken) &&
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