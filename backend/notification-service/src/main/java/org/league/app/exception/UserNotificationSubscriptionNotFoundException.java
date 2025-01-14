package org.league.app.exception;

public class UserNotificationSubscriptionNotFoundException extends RuntimeException {
    public UserNotificationSubscriptionNotFoundException(String message) {
        super(message);
    }
}
