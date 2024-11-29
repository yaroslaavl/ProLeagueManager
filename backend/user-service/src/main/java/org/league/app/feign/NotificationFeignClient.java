package org.league.app.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient("notification-service")
public interface NotificationFeignClient {

    @PostMapping("/api/notification/send-email")
    public ResponseEntity<String> sendEmail(@RequestBody EmailRequest emailRequest);
}
