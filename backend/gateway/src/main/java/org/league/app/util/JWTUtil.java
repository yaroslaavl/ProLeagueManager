package org.league.app.util;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;

@Slf4j
@Component
public class JWTUtil {

    @Value( "${token.signing.key}")
    private String secretKey;

    public void validatedToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(getSignInKey()).build().parseClaimsJws(token);
        } catch (JwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
            throw new RuntimeException("Invalid JWT token", e);
        }
    }

    public Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

}
