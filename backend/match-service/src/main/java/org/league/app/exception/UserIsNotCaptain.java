package org.league.app.exception;

public class UserIsNotCaptain extends RuntimeException {
    public UserIsNotCaptain(String message) {
        super(message);
    }
}
