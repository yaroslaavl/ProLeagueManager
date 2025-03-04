package org.league.app.controller;


import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.feign.EmailRequest;
import org.league.app.feign.EmailRequestWithQrCode;
import org.league.app.service.MailSenderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @PostMapping("/send-email-with-qr-code")
    public ResponseEntity<String> sendMailWithQrCode(@RequestHeader("Authorization") String token,
                                                     @RequestBody EmailRequestWithQrCode emailRequestWithQrCode) {
        try {
            mailSenderService.sendMailWithQrCode(emailRequestWithQrCode.getTo(), emailRequestWithQrCode.getSubject(), emailRequestWithQrCode.getBody(), emailRequestWithQrCode.getQrCodeFile());
            log.info("'{}'", emailRequestWithQrCode);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to send email: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
