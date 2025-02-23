package org.league.app.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ToursWithTimeGapDto {

    Integer leagueTourNumber;
    LocalDateTime firstTourMatch;
    LocalDateTime lastTourMatch;
}
