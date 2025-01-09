package org.league.app.exception;

public class GameSystemAlreadyExists extends RuntimeException {
    public GameSystemAlreadyExists(String message) {
        super(message);
    }
}
