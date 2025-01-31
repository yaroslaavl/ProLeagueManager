package org.league.app.exception;

public class TeamAlreadyParticipating extends RuntimeException {
    public TeamAlreadyParticipating(String message) {
        super(message);
    }
}
