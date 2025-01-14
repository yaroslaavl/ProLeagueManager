package org.league.app.exception;

public class CompetitionAlreadyExists extends RuntimeException {
    public CompetitionAlreadyExists(String message) {
        super(message);
    }
}
