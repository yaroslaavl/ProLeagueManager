package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Event;
import org.league.app.database.repository.EventRepository;
import org.league.app.dto.EventCreateEditDto;
import org.league.app.dto.EventReadDto;
import org.league.app.exception.EventNotFound;
import org.league.app.mapper.EventMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    public EventReadDto findById(UUID eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new EventNotFound("Event not found"));

        return eventMapper.toDto(event);
    }

    @Transactional
    public EventReadDto createPinnedEvent(EventCreateEditDto eventCreateEditDto) {

        Event event = Event.builder()
                .title(eventCreateEditDto.getTitle())
                .matchId(eventCreateEditDto.getMatchId())
                .competitionId(eventCreateEditDto.getCompetitionId())
                .eventType(eventCreateEditDto.getEventType())
                .status(eventCreateEditDto.getStatus())
                .isPinned(Boolean.TRUE)
                .createdAt(LocalDateTime.now())
                .build();

        eventRepository.save(event);

        return eventMapper.toDto(event);
    }


}
