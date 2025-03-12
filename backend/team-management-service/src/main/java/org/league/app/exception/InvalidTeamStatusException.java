package org.league.app.exception;

public class InvalidTeamStatusException extends RuntimeException {
    public InvalidTeamStatusException(String message) {
        super(message);
    }
}
