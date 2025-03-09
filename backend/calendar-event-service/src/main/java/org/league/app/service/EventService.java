package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Event;
import org.league.app.database.entity.enums.Category;
import org.league.app.database.entity.enums.EventType;
import org.league.app.database.entity.enums.Status;
import org.league.app.database.repository.EventRepository;
import org.league.app.dto.EventCreateEditDto;
import org.league.app.dto.EventReadDto;
import org.league.app.exception.EventNotFound;
import org.league.app.feign.competitionClient.CompetitionClientFeign;
import org.league.app.mapper.EventMapper;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;
    private final CompetitionClientFeign competitionClientFeign;

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
                .category(eventCreateEditDto.getCategory())
                .createdAt(LocalDateTime.now())
                .build();

        eventRepository.save(event);

        return eventMapper.toDto(event);
    }

    public void createAutoEvent(EventCreateEditDto eventCreateEditDto) {
        Event event = Event.builder()
                .title(eventCreateEditDto.getTitle())
                .matchId(eventCreateEditDto.getMatchId())
                .competitionId(eventCreateEditDto.getCompetitionId())
                .eventType(eventCreateEditDto.getEventType())
                .status(eventCreateEditDto.getStatus())
                .isPinned(Boolean.FALSE)
                .eventImage(eventCreateEditDto.getEventImage())
                .category(eventCreateEditDto.getCategory())
                .createdAt(LocalDateTime.now())
                .build();

        try {
            eventRepository.save(event);
        } catch (DataIntegrityViolationException e) {
            log.warn("Could not save, not found: {}", event, e);
        }
    }

    @Transactional
    public void processEvent(EventType eventType,
                             List<Event> events,
                             List<UUID> cache,
                             Map<UUID, Boolean> typeMap,
                             boolean isMatchBased) {
        Set<UUID> missing = cache.stream()
                .filter(id -> events.stream().noneMatch(event -> (isMatchBased ? event.getMatchId() : event.getCompetitionId()).equals(id)))
                .collect(Collectors.toSet());

        if (!missing.isEmpty()) {
            for (UUID id : missing) {
                Boolean isEsport = typeMap.getOrDefault(id, Boolean.FALSE);
                String eventImage = isMatchBased ? null : competitionClientFeign.getCompetitionImage(id);

                createAutoEvent(new EventCreateEditDto(
                        "Auto-Generated " + eventType.name() + " Event",
                        isMatchBased ? id : null,
                        isMatchBased ? null : id,
                        eventType,
                        Status.PUBLISHED,
                        Boolean.FALSE,
                        isEsport ? Category.ESPORT : Category.SPORT,
                        eventImage,
                        LocalDateTime.now()
                ));
            }
        }

        List<Event> published = eventRepository.findEventsByEventTypeAndStatus(eventType, Status.PUBLISHED);

        List<Event> eventsToArchive  = published.stream()
                .filter(event -> !cache.contains(isMatchBased ? event.getMatchId() : event.getCompetitionId()))
                .toList();

        if (!eventsToArchive.isEmpty()) {
            eventsToArchive.forEach(event -> event.setStatus(Status.ARCHIVED));
            eventRepository.saveAll(eventsToArchive);
        }
    }
}
