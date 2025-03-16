package org.league.app.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;
import java.util.Set;

@Slf4j
@Component
public class RouteFilter extends OncePerRequestFilter {

    private final RequestMappingHandlerMapping handlerMapping;

    public RouteFilter(@Qualifier("requestMappingHandlerMapping") RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    private static final Set<String> EXCLUDED_PATHS = Set.of(
            "/oauth2/authorization/google",
            "/login/oauth2/code/google",
            "/login"
    );

    private static boolean isExcluded(String path) {
        return EXCLUDED_PATHS.contains(path) || path.startsWith("/actuator/") || path.equals("/actuator");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getServletPath();

        if(isExcluded(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            if (handlerMapping.getHandler(request) == null) {
                log.error("Path not found: {}", path);
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\": \"Not Found\", \"message\": \"The request path is not found. Please check the URL and try again.\"}");
                return;
            }
        } catch (Exception e) {
            log.error("Error while checking handler for path: {}", path, e);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
