package org.league.app.exception;

public class UserAlreadyVerified extends IllegalStateException {
    public UserAlreadyVerified(String message) {
        super(message);
    }
}