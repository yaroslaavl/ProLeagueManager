package org.league.app.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.league.app.redisclient.RedisClient;
import org.league.app.service.JWTService;
import org.league.app.service.UserService;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Slf4j
@Component
public class JWTFilter extends OncePerRequestFilter {

    private final JWTService jwtService;
    private final UserService userService;
    private final RedisClient redisClient;


    public JWTFilter(@Lazy JWTService jwtService, UserService userService, RedisClient redisClient) {
        this.jwtService = jwtService;
        this.userService = userService;
        this.redisClient = redisClient;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.equals("/api/user/allUsers")
                ||path.equals("/api/auth/login")
                || path.equals("/api/auth/registration")
                || path.equals("/api/auth/activate")
                || path.equals("/actuator/health")
                || path.startsWith("/api/user/profile/public/")
                || path.startsWith("/api/user/avatar/")
                || path.equals("/api/auth/get-token")
                || path.equals("/api/auth/set-token")
                || path.equals("/api/auth/delete-token")
                || path.equals("/api/user/send-reset-password")
                || path.startsWith("/api/user/reset-password/")
                || path.equals("/api/user/search-user")
                || path.startsWith("/api/user/reset-password-check/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {


        String path = request.getServletPath();

        if (path.equals("/api/auth/refresh-token")) {
            handleRefreshToken(request, response, filterChain);
            return;
        }

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
            email = jwtService.extractEmail(jwtToken);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Invalid or expired JWT token\"}");
            return;
        }

        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userService.loadUserByUsername(email);

            if (jwtService.isTokenValid(jwtToken, userDetails) && jwtService.isAccessToken(jwtToken) &&
                    redisClient.get(
                    "whitelist:" + userDetails.getUsername() + ":accessToken").equals(jwtToken)) {
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            } else {
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Missing or invalid token\"}");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private void handleRefreshToken(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws IOException, ServletException {
        String authorizationHeader = request.getHeader("Authorization");
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Missing or invalid Authorization header\"}");
            return;
        }

        String refreshToken = authorizationHeader.substring(7);
        String email;

        try {
            email = jwtService.extractEmail(refreshToken);
        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"Invalid or expired refresh token\"}");
            return;
        }

        String storedRefreshToken = redisClient.get("whitelist:" + email + ":refreshToken");
        if (storedRefreshToken == null || !storedRefreshToken.equals(refreshToken)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json");
            response.getWriter().write("{\"error\": \"Forbidden\", \"message\": \"Missing or invalid token\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
