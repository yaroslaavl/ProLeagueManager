package org.league.app.database.entity.enums;

public enum TeamStatus {

    //Team is registered in competition
    REGISTERED,

    //Team is in match
    IN_PLAY,

    //Team is not registered in competition and does not play anywhere at this moment
    INACTIVE,

    //Team is banned
    BANNED
}
