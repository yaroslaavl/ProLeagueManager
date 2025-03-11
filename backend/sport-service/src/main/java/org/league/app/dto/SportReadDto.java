package org.league.app.dto;

import lombok.*;

import java.time.LocalDateTime;


@Value
public class SportReadDto {

    Integer id;
    String name;
    Boolean isEsport;
    LocalDateTime createdAt;
}