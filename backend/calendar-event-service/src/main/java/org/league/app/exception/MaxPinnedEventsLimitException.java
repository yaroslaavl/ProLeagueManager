package org.league.app.exception;

public class MaxPinnedEventsLimitException extends RuntimeException {
    public MaxPinnedEventsLimitException(String message) {
        super(message);
    }
}
