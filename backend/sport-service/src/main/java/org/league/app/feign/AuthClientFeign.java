package org.league.app.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;

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

    @GetMapping("/api/auth/load-user-by-email")
    UserDto loadUserByEmail(@RequestHeader("Authorization") String token, @RequestParam("email") String email);

    @GetMapping("/api/auth/get-user-by-email")
    UserDto getUserByEmail(@RequestHeader("Authorization") String token, @RequestParam("email") String email);
}