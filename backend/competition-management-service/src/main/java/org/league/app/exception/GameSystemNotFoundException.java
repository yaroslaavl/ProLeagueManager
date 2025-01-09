package org.league.app.exception;

public class GameSystemNotFoundException extends RuntimeException {
    public GameSystemNotFoundException(String message) {
        super(message);
    }
}
