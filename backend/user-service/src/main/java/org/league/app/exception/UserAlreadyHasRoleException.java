package org.league.app.exception;

public class UserAlreadyHasRoleException extends RuntimeException {
    public UserAlreadyHasRoleException(String message) {
        super(message);
    }
}
