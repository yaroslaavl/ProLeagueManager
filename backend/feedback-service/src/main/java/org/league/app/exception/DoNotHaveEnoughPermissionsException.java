package org.league.app.exception;

public class DoNotHaveEnoughPermissionsException extends RuntimeException {
    public DoNotHaveEnoughPermissionsException(String message) {
        super(message);
    }
}