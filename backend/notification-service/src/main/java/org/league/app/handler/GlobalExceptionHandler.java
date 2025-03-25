package org.league.app.handler;

import org.league.app.exception.NotificationNotFoundException;
import org.league.app.exception.TeamNotFoundException;
import org.league.app.exception.UserNotFoundException;
import org.league.app.exception.UserNotificationSubscriptionNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final org.springframework.http.HttpStatus NOT_FOUND_STATUS = HttpStatus.NOT_FOUND;

    private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String error, String message) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        return ResponseEntity.status(status).body(errorResponse);
    }

    @ExceptionHandler({
            NotificationNotFoundException.class,
            TeamNotFoundException.class,
            UserNotFoundException.class,
            UserNotificationSubscriptionNotFoundException.class
    })
    public ResponseEntity<Map<String, String>> handleNotFoundExceptions(Exception ex) {
        String errorMessage;
        if (ex instanceof NotificationNotFoundException) {
            errorMessage = "Notification not found";
        } else if (ex instanceof TeamNotFoundException) {
            errorMessage = "Team not found";
        } else if (ex instanceof UserNotFoundException) {
            errorMessage = "User not found";
        } else if (ex instanceof UserNotificationSubscriptionNotFoundException) {
            errorMessage = "User notification subscription failed";
        } else {
            errorMessage = "Resource not found";
        }
        return buildErrorResponse(HttpStatus.NOT_FOUND, errorMessage, ex.getMessage());
    }

}
