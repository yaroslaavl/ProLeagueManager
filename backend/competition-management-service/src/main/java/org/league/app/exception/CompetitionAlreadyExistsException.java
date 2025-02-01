package org.league.app.exception;

public class CompetitionAlreadyExistsException extends RuntimeException {
    public CompetitionAlreadyExistsException(String message) {
        super(message);
    }
}
