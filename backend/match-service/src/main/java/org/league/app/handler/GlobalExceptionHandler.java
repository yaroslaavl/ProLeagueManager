package org.league.app.handler;

import org.league.app.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String error, String message) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", error);
        errorResponse.put("message", message);
        return ResponseEntity.status(status).body(errorResponse);
    }

    @ExceptionHandler(UserIsNotCaptain.class)
    private ResponseEntity<Map<String, String>> handleUserIsNotCaptainException(UserIsNotCaptain userIsNotCaptain) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "User is not captain", userIsNotCaptain.getMessage());
    }

    @ExceptionHandler(FinalizeCompetitionException.class)
    private ResponseEntity<Map<String, String>> handleUserIsNotCaptainException(FinalizeCompetitionException finalizeCompetitionException) {
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Finalize competition failed", finalizeCompetitionException.getMessage());
    }

    @ExceptionHandler(NotPartOfMatchException.class)
    private ResponseEntity<Map<String, String>> handleUserIsNotCaptainException(NotPartOfMatchException notPartOfMatchException) {
        return buildErrorResponse(HttpStatus.FORBIDDEN, "This team or player is not a part of match", notPartOfMatchException.getMessage());
    }

    @ExceptionHandler(InvalidMatchStateException.class)
    private ResponseEntity<Map<String, String>> handleUserIsNotCaptainException(InvalidMatchStateException invalidMatchStateException) {
        return buildErrorResponse(HttpStatus.CONFLICT, "Invalid match state", invalidMatchStateException.getMessage());
    }

    @ExceptionHandler(MatchNotFoundException.class)
    private ResponseEntity<Map<String, String>> handleUserIsNotCaptainException(MatchNotFoundException matchNotFoundException) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, "Match not found", matchNotFoundException.getMessage());
    }
}
