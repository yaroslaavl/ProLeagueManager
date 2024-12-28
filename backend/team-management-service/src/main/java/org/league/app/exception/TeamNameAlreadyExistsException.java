package org.league.app.exception;

public class TeamNameAlreadyExistsException extends RuntimeException {
    public TeamNameAlreadyExistsException(String teamNameAlreadyExists) {
        super(teamNameAlreadyExists);
    }
}
