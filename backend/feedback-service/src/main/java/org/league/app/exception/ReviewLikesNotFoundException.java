package org.league.app.exception;

public class ReviewLikesNotFoundException extends RuntimeException {
    public ReviewLikesNotFoundException(String message) {
        super(message);
    }
}