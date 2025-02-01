package org.league.app.handler;

import org.league.app.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(CompetitionAlreadyExistsException.class)
    public ResponseEntity<Map<String, String>> handleCompetitionAlreadyExists() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Competition with current name already exists");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> handleUUIDFormatException(MethodArgumentTypeMismatchException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Invalid UUID format");
        errorResponse.put("details", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(CompetitionNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleCompetitionNotFound() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Competition not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(GameSystemNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleGameSystemNotFound() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Game System not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(UserAlreadyParticipating.class)
    public ResponseEntity<Map<String, String>> handleUserAlreadyParticipating() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "User already participating");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(TeamAlreadyParticipating.class)
    public ResponseEntity<Map<String, String>> handleTeamAlreadyParticipating() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Team already participating");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(CaptainNotIncludedException.class)
    public ResponseEntity<Map<String, String>> handleCaptainNotIncluded() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Captain not included");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(ManagerNotFound.class)
    public ResponseEntity<Map<String, String>> handleManagerNotFound() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Manager not found");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(PlayerSizeNotMatchException.class)
    public ResponseEntity<Map<String, String>> handlePlayerSizeNotMatch() {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Player size not match");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }
}