package org.league.app.exception;

public class NotPartOfMatchException extends RuntimeException {
    public NotPartOfMatchException(String message) {
        super(message);
    }
}
