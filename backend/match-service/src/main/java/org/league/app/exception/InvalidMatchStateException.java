package org.league.app.exception;

public class InvalidMatchStateException extends RuntimeException {
    public InvalidMatchStateException(String message) {
        super(message);
    }
}
