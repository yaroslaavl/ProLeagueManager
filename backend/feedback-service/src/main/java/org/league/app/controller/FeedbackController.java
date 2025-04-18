package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.dto.FeedbackCreateEditDto;
import org.league.app.dto.FeedbackReadDto;
import org.league.app.service.FeedbackMetrics;
import org.league.app.service.FeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.springframework.http.ResponseEntity.noContent;
import static org.springframework.http.ResponseEntity.notFound;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final FeedbackMetrics feedbackMetrics;

    @PostMapping("/create/{competitionId}")
    public ResponseEntity<FeedbackReadDto> sendFeedback(@PathVariable("competitionId") UUID competitionId,
                                                        @RequestBody FeedbackCreateEditDto feedbackCreateEditDto) {
        return ResponseEntity.ok(feedbackService.sendFeedback(competitionId, feedbackCreateEditDto.getMessage()));
    }

    @PutMapping("/edit/{feedbackId}")
    public ResponseEntity<FeedbackReadDto> editFeedback(@PathVariable("feedbackId") UUID feedbackId,
                                                        @RequestBody FeedbackCreateEditDto feedbackCreateEditDto) {
        return ResponseEntity.ok(feedbackService.editFeedback(feedbackId, feedbackCreateEditDto.getMessage()));
    }

    @DeleteMapping("/delete/{feedbackId}")
    public ResponseEntity<?> deleteFeedback(@PathVariable("feedbackId") UUID feedbackId) {
        return feedbackService.deleteFeedback(feedbackId)
                ? noContent().build()
                : notFound().build();
    }

    @PutMapping("/like/{feedbackId}")
    public ResponseEntity<Void> likeFeedback(@PathVariable("feedbackId") UUID feedbackId) {
        feedbackService.likeFeedback(feedbackId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/interval/{days}")
    public List<FeedbackReadDto> getFeedbacksBetween(@PathVariable("days") Integer days) {
        List<FeedbackReadDto> allFeedbackByDate = feedbackService.findAllFeedbackByDate(days);

        feedbackMetrics.recordReturnedSize(days, allFeedbackByDate.size());
        return allFeedbackByDate;
    }

    @GetMapping("/count/by/tonality")
    public ResponseEntity<Map<String, Long>> getByTonality(@RequestParam("from") LocalDateTime from,
                                                              @RequestParam("to") LocalDateTime to) {
       return ResponseEntity.ok(feedbackService.findAllByTonality(from, to));
    }

    @GetMapping("/exact/{id}")
    public ResponseEntity<FeedbackReadDto> getFeedback(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(feedbackService.findById(id));
    }

    @GetMapping("/get-by-competition")
    public ResponseEntity<List<FeedbackReadDto>> getByCompetition(@RequestParam("competitionId") UUID competitionId) {
        return ResponseEntity.ok(feedbackService.findByCompetitionId(competitionId));
    }

    @GetMapping("/all")
    public ResponseEntity<List<FeedbackReadDto>> findAll() {
        return ResponseEntity.ok(feedbackService.findAll());
    }
}