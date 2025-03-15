package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.repository.EventRepository;
import org.league.app.dto.EventCreateEditDto;
import org.league.app.dto.EventReadDto;
import org.league.app.dto.UploadEventImageDto;
import org.league.app.mapper.EventMapper;
import org.league.app.service.EventService;
import org.league.app.service.MinioService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/api/event")
@RequiredArgsConstructor
public class EventController {

    private final EventMapper eventMapper;
    private final EventService eventService;
    private final EventRepository eventRepository;
    private final MinioService minioService;

    @GetMapping("/published")
    public List<EventReadDto> allEventsWhereStatusIsPublished() {
        List<EventReadDto> allWithPublishedStatus = eventService.findAllWithPublishedStatusAndIsPinnedFalse();

        log.info("Published event size: {}", allWithPublishedStatus.size());
        return allWithPublishedStatus;
    }

    @GetMapping("/pinned")
    public List<EventReadDto> allPinnedEvents() {
        List<EventReadDto> pinnedEvents = eventService.findPinnedEvents();

        log.info("Pinned event size: {}", pinnedEvents.size());
        return pinnedEvents;
    }

    @GetMapping("/all")
    public List<EventReadDto> all() {
        List<EventReadDto> allEvents = eventService.findAll();

        log.info("All event size: {}", allEvents.size());
        return allEvents;
    }

    @GetMapping("/id/{eventId}")
    public EventReadDto findById(@PathVariable("eventId") UUID eventId) {
        EventReadDto eventById = eventService.findById(eventId);

        log.info("Find event by id: {}", eventById);
        return eventById;
    }

    @PostMapping("/pinned")
    public ResponseEntity<EventReadDto> createPinnedEvent(@RequestBody EventCreateEditDto eventCreateEditDto,
                                                          @RequestParam("ttl") int ttl,
                                                          @RequestParam("timeUnit") Optional<TimeUnit> timeUnit) {
        TimeUnit time = timeUnit.orElse(TimeUnit.DAYS);

        log.info("Create pinned event with type: {}", eventCreateEditDto.getEventType());
        return ResponseEntity.ok(eventService.createPinnedEvent(eventCreateEditDto, ttl, time));
    }

    @PostMapping("/upload-pinned-image/{eventId}")
    public void uploadCompetitionImage(@PathVariable("eventId") UUID eventId,
                                       @Validated({CreateAction.class, EditAction.class}) UploadEventImageDto uploadEventImageDto) {
        log.info("Uploading image for pinned event = {}", eventId);
        minioService.uploadImage(eventId, uploadEventImageDto);
    }

    @GetMapping("/image/{eventId}")
    public ResponseEntity<String> getCompetitionImage(@PathVariable("eventId") UUID eventId) {
        return ResponseEntity.ok(minioService.getPinnedEventImage(eventId));
    }

    @DeleteMapping("/pinned/{eventId}")
    public ResponseEntity<String> deletePinnedEvent(@PathVariable("eventId") UUID eventId) {
        log.info("Delete pinned event with id: {}", eventId);
        eventService.deletePinnedEvent(eventId);

        return ResponseEntity.ok("Event deleted successfully");
    }
}
