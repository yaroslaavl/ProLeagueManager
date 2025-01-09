package org.league.app.feign.authClient;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

@FeignClient("user-service")
public interface AuthClientFeign {

    @PostMapping("/api/auth/extract-email")
    String extractEmail(@RequestHeader(HttpHeaders.AUTHORIZATION) String token);

    @PostMapping("/api/auth/validate-token")
    boolean validateToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("email") String email);

    @PostMapping("/api/auth/is-access-token")
    boolean isAccessToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token);

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
    UserDto loadUserByEmail(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("email") String email);

    @GetMapping("/api/auth/get-user-by-email")
    UserDto getUserByEmail(@RequestParam("email") String email);
}

