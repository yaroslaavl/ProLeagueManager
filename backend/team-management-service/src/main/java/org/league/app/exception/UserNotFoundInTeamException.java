package org.league.app.exception;

public class UserNotFoundInTeamException extends RuntimeException {
    public UserNotFoundInTeamException(String message) {
        super(message);
    }
}
