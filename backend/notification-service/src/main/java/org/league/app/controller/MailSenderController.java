package org.league.app.controller;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.dto.EmailRequest;
import org.league.app.service.MailSenderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/notification")
public class MailSenderController {

    private final MailSenderService mailSenderService;

    @PostMapping("/send-email")
    public ResponseEntity<String> sendEmail(@RequestBody EmailRequest emailRequest) {
        try {
            mailSenderService.sendMail(emailRequest.getTo(), emailRequest.getSubject(), emailRequest.getBody());
            log.info("'{}'", emailRequest);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to send email: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
