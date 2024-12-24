package org.league.app.exception;


public class SportAlreadyExists extends RuntimeException {

    public SportAlreadyExists(String message) {
        super(message);
    }

}