package org.league.app.handler;

import org.league.app.exception.InvitationException;
import org.league.app.exception.TeamNameAlreadyExistsException;
import org.league.app.exception.TeamNotFoundException;
import org.league.app.exception.UserAlreadyInThisTeamException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TeamNameAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleTeamNameAlreadyExistsException() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Team Name Already Exists");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(TeamNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleTeamNotFoundException() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Team Not Found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, String>> handleBadCredentialsException(Exception ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Bad Credentials");
        errorResponse.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errorResponse.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(InvitationException.class)
    public ResponseEntity<Map<String, String>> handleInvitationException(InvitationException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Invitation Failed");
        errorResponse.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(UserAlreadyInThisTeamException.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyInThisTeamException(UserAlreadyInThisTeamException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Bad credentials");
        errorResponse.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}
