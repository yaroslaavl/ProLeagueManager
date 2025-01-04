package org.league.app.exception;

public class UserAlreadyVerifiedException extends IllegalStateException {
    public UserAlreadyVerifiedException(String message) {
        super(message);
    }
}