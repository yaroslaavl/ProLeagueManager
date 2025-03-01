package org.league.app.handler;

import org.league.app.exception.CompetitionException;
import org.league.app.exception.DoNotHaveEnoughPermissionsException;
import org.league.app.exception.FeedbackNotFoundException;
import org.league.app.exception.ReviewLikesNotFoundException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(FeedbackNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleFeedbackNotFoundException(FeedbackNotFoundException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }

    @ExceptionHandler(DoNotHaveEnoughPermissionsException.class)
    public ResponseEntity<Map<String, String>> handleDoNotHaveEnoughPermissionsException(DoNotHaveEnoughPermissionsException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("error", "Forbidden");
        errorResponse.put("message", "You don't have enough permissions");
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
    }

    @ExceptionHandler(CompetitionException.class)
    public ResponseEntity<Map<String, String>> handleCompetitionException(CompetitionException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", "Competition not finished yet");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
    }

    @ExceptionHandler(ReviewLikesNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleReviewLikesNotFoundException(ReviewLikesNotFoundException ex) {
        Map<String, String> errorResponse = new HashMap<>();
        errorResponse.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
    }
}