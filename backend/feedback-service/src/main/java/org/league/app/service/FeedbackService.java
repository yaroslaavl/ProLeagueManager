package org.league.app.service;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Feedback;
import org.league.app.database.entity.ReviewLikes;
import org.league.app.database.repository.FeedbackRepository;
import org.league.app.database.repository.ReviewLikesRepository;
import org.league.app.database.specification.FeedbackSpecification;
import org.league.app.dto.FeedbackReadDto;
import org.league.app.exception.CompetitionException;
import org.league.app.exception.DoNotHaveEnoughPermissionsException;
import org.league.app.exception.FeedbackNotFoundException;
import org.league.app.exception.ReviewLikesNotFoundException;
import org.league.app.feign.authClient.AuthClientFeign;
import org.league.app.feign.authClient.UserDto;
import org.league.app.feign.competitionClient.CompetitionClientFeign;
import org.league.app.feign.competitionClient.CompetitionDto;
import org.league.app.mapper.FeedbackMapper;
import org.league.app.service.util.AzureTextAnalyticsService;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final AuthClientFeign authClientFeign;
    private final CompetitionClientFeign competitionClientFeign;
    private final FeedbackRepository feedbackRepository;
    private final AzureTextAnalyticsService azure;
    private final FeedbackMapper feedbackMapper;
    private final ReviewLikesRepository reviewLikesRepository;
    private final FeedbackMetrics feedbackMetrics;

    @Transactional
    public FeedbackReadDto sendFeedback(UUID competitionId, String message) {
        UserDto user = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        if (!competitionClientFeign.findAllPlayersByCompetitionId(competitionId).contains(user.getId())) {
            throw new DoNotHaveEnoughPermissionsException("You haven't participated in this competition");
        }

        CompetitionDto competition = competitionClientFeign.findById(competitionId);

        if (!(competition.getStatus().equalsIgnoreCase("COMPLETED") || competition.getStatus().equalsIgnoreCase("ACTIVE"))) {
            throw new CompetitionException("This competition is not started yet");
        }

        String tonality;
        String lang;
        try {
            tonality = azure.getSentiment(message);
            lang = azure.getLanguage(message);
        } catch (Exception e) {
            log.error("Azure Text Analytics error while creating: {}", e.getMessage());
            tonality = "unknown";
            lang = "unknown";
        }

        Feedback newFeedback = Feedback.builder()
                .userId(user.getId())
                .competitionId(competitionId)
                .message(message)
                .tonality(tonality)
                .lang(lang)
                .likes(0)
                .createdAt(LocalDateTime.now())
                .build();

        feedbackRepository.save(newFeedback);
        return feedbackMapper.toDto(newFeedback);
    }

    @Transactional
    public FeedbackReadDto editFeedback(UUID feedbackId, String message) {
        UserDto user = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        Feedback oldFeedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new FeedbackNotFoundException("There is no feedback with id: " + feedbackId));

        if (!oldFeedback.getUserId().equals(user.getId())) {
            throw new DoNotHaveEnoughPermissionsException("You are not allowed to change this message");
        }

        oldFeedback.setMessage(message);
        String tonality;
        String lang;
        try {
            tonality = azure.getSentiment(message);
            lang = azure.getLanguage(message);
        } catch (Exception e) {
            log.error("Azure Text Analytics error: {}", e.getMessage());
            tonality = "unknown";
            lang = "unknown";
        }
        oldFeedback.setTonality(tonality);
        oldFeedback.setLang(lang);

        feedbackRepository.save(oldFeedback);

        return feedbackMapper.toDto(oldFeedback);
    }

    @Transactional
    public boolean deleteFeedback(UUID feedbackId) {
        UserDto user = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new FeedbackNotFoundException("There is no feedback with id: " + feedbackId));

        if (!feedback.getUserId().equals(user.getId())) {
            throw new DoNotHaveEnoughPermissionsException("You are not allowed to delete this message");
        }
        feedbackRepository.delete(feedback);
        feedbackRepository.flush();

        return feedbackRepository.findById(feedbackId).isEmpty();
    }

    @Transactional
    public void likeFeedback(UUID feedbackId) {
        UserDto user = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new FeedbackNotFoundException("There is no feedback with id: " + feedbackId));


        if (reviewLikesRepository.findByFeedbackIdAndUserId(feedbackId, user.getId()).isEmpty()) {
            feedback.setLikes(feedback.getLikes() + 1);
            ReviewLikes reviewLikes = ReviewLikes.builder()
                    .feedback(feedback)
                    .userId(user.getId())
                    .build();

            feedbackRepository.save(feedback);
            reviewLikesRepository.save(reviewLikes);
        } else {
            feedback.setLikes(feedback.getLikes() - 1);
            ReviewLikes reviewLikes = reviewLikesRepository.findByFeedbackId(feedbackId).orElseThrow(() -> new ReviewLikesNotFoundException("There is no likes with feedback id: " + feedbackId));
            reviewLikesRepository.delete(reviewLikes);
            feedbackRepository.save(feedback);
        }
    }

    public FeedbackReadDto findById(UUID feedbackId) {
        return feedbackRepository.findById(feedbackId).map(feedbackMapper::toDto).
                orElseThrow(() -> new FeedbackNotFoundException("There is no feedback with id: " + feedbackId));
    }

    public List<FeedbackReadDto> findByCompetitionId(UUID competitionId) {
        return feedbackRepository.findAllByCompetitionId(competitionId).stream().map(feedbackMapper::toDto).toList();
    }

    public List<FeedbackReadDto> findAll() {
        return feedbackRepository.findAllSortByCreatedAt().stream().map(feedbackMapper::toDto).toList();
    }

    public Map<String, Long> findAllByTonality(LocalDateTime from, LocalDateTime to) {
        List<Object[]> allByTolerance = feedbackRepository.findAllByTonality(from, to);
        Map<String, Long> countsMap = allByTolerance.stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));

        List<String> allTonalities = List.of("positive", "neutral", "negative");

        for (String tonality : allTonalities) {
            long count = countsMap.getOrDefault(tonality, 0L);
            feedbackMetrics.recordReturnedByTonality(tonality, count);
        }

        return countsMap;
    }

    public List<FeedbackReadDto> findAllFeedbackByDate(Integer days) {
        Specification<Feedback> specification = Specification.where(FeedbackSpecification.findAllFeedbackByDaysWeeksMonths(days));

        return feedbackRepository.findAll(specification).stream().map(feedbackMapper::toDto).toList();
    }

    private String getTokenFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return request.getHeader("Authorization");
        }
        return null;
    }

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto userDto) {
            return userDto.getEmail();
        }
        return authentication.getName();
    }
}