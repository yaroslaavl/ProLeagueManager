package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.service.MatchService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TournamentEventListener {

    private final MatchService matchService;

    @RabbitListener(queues = "tournament.start.queue")
    public void handleTournamentStartMessage(TournamentBracketDto tournamentBracketDto) {
        log.info("Received tournament start event: {}", tournamentBracketDto);

        matchService.generateTournamentBracket(tournamentBracketDto);
    }
}
