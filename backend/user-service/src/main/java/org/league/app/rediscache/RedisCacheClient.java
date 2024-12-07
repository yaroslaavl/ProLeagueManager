package org.league.app.rediscache;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
@RequiredArgsConstructor
public class RedisCacheClient {

    @Autowired
    private final StringRedisTemplate redisTemplate;

    public void set(String key, String value, long timeout, TimeUnit timeUnit) {
        redisTemplate.opsForValue().set(key, value, timeout, timeUnit);
    }

    public String get(String key) {
        return redisTemplate.opsForValue().get(key);
    }

    public void delete(String key) {
        redisTemplate.delete(key);
    }

    public boolean isUserTokenInWhiteList(String username, String token) {
        String tokenFromRedis = get("whitelist: " + username);
        return tokenFromRedis != null && tokenFromRedis.equals(token);
    }

}
