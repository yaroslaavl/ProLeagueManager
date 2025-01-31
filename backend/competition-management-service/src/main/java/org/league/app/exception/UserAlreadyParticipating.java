package org.league.app.exception;

public class UserAlreadyParticipating extends RuntimeException {
    public UserAlreadyParticipating(String message) {
        super(message);
    }
}
