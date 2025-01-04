package org.league.app.exception;

public class UserAlreadyInThisTeamException extends RuntimeException {
    public UserAlreadyInThisTeamException(String message) {
        super(message);
    }
}
