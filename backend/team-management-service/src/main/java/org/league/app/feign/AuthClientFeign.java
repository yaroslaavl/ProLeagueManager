package org.league.app.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.HttpHeaders;
import org.springframework.web.bind.annotation.*;

@FeignClient("user-service")
public interface AuthClientFeign {

    @PostMapping("/api/auth/extract-email")
    String extractEmail(@RequestHeader(HttpHeaders.AUTHORIZATION) String token);

    @PostMapping("/api/auth/validate-token")
    boolean validateToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("email") String email);

    @PostMapping("/api/auth/is-access-token")
    boolean isAccessToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token);

    @GetMapping("/api/auth/get-token")
    String getToken(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("key") String key);

    @GetMapping("/api/auth/load-user-by-email")
    UserDto loadUserByEmail(@RequestHeader(HttpHeaders.AUTHORIZATION) String token, @RequestParam("email") String email);
}

