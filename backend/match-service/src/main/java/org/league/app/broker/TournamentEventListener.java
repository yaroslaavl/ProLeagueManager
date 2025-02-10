package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.service.MatchService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TournamentEventListener {

    private final MatchService matchService;

    @RabbitListener(queues = "tournament.start.queue")
    public void handleTournamentStartMessage(String competitionId) {
        log.info("Received tournament start event for competition: {}", competitionId);

        matchService.generateTournamentBracket(competitionId);
    }
}
