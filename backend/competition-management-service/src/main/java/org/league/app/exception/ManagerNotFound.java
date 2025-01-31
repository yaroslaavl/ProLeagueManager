package org.league.app.exception;

public class ManagerNotFound extends RuntimeException {
    public ManagerNotFound(String message) {
        super(message);
    }
}
