package org.league.app.exception;

public class SportNotFoundException extends RuntimeException {
    public SportNotFoundException(String message) {
        super(message);
    }
}