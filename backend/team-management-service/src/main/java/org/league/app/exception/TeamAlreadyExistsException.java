package org.league.app.exception;

public class TeamAlreadyExistsException extends RuntimeException {
    public TeamAlreadyExistsException(String teamNameAlreadyExists) {
        super(teamNameAlreadyExists);
    }
}
