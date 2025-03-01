package org.league.app.dto;

import lombok.Value;

import java.time.LocalDateTime;
import java.util.UUID;

@Value
public class FeedbackReadDto {

    UUID id;
    Long userId;
    UUID competitionId;
    String message;
    Integer likes;
    String tonality;
    String lang;
    LocalDateTime createdAt;
}