package org.league.app.exception;

public class IncorrectTournamentStatus extends RuntimeException {
    public IncorrectTournamentStatus(String message) {
        super(message);
    }
}
