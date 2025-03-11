package org.league.app.feign.authClient;

import io.github.resilience4j.retry.annotation.Retry;
import org.league.app.feign.notificationClient.NotificationClientFeign;
import org.league.app.feign.notificationClient.NotificationDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@FeignClient("user-service")
public interface AuthClientFeign {

    @PostMapping("/api/auth/extract-email")
    String extractEmail(@RequestHeader("Authorization") String token, @RequestParam("extractToken") String extractToken);

    @PostMapping("/api/auth/validate-token")
    boolean validateToken(@RequestHeader("Authorization") String token, @RequestParam("validToken") String validToken, @RequestParam("email") String email);

    @PostMapping("/api/auth/is-access-token")
    boolean isAccessToken(@RequestHeader("Authorization") String token, @RequestParam("accessToken") String accessToken);

    @GetMapping("/api/auth/get-token")
    String getToken(@RequestParam("key") String key);

    @PostMapping("/api/auth/set-token")
    String setToken(@RequestParam("key") String key,
                    @RequestParam("value") String value,
                    @RequestParam("timeToLive") long timeToLive,
                    @RequestParam("timeUnit") TimeUnit timeUnit);

    @PostMapping("/api/auth/delete-token")
    String deleteToken(@RequestParam("key") String key);

    @GetMapping("/api/auth/load-user-by-email")
    UserDto loadUserByEmail(@RequestHeader("Authorization") String token, @RequestParam("email") String email);

    @GetMapping("/api/auth/get-user-by-email")
    UserDto getUserByEmail(@RequestHeader("Authorization") String token, @RequestParam("email") String email);

    @Retry(name = "userServiceRetry", fallbackMethod = "fallbackUser")
    @GetMapping("/api/user/id-dto/{userId}")
    UserDto getUserDto(@PathVariable("userId") Long userId);

    default UserDto fallbackUser(Long userId,
                                 Throwable t) {
        Logger logger = LoggerFactory.getLogger(AuthClientFeign.class);
        logger.warn("User service is down. Cannot send user data. Error: {}", t.getMessage());

        throw new RuntimeException("Service did not send user data", t);
    }
}

