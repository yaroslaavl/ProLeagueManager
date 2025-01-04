package org.league.app.exception;

public class UserEmailIsNotVerifiedException extends RuntimeException {
    public UserEmailIsNotVerifiedException(String message) {
        super(message);
    }
}
