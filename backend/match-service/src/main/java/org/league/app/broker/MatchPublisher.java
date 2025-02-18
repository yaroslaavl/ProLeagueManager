package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MatchPublisher {

    private final RabbitTemplate rabbitTemplate;

    public boolean publishFinalizedCompetition(String competitionId) {
        log.info("Publishing final stage of competition with id: '{}'", competitionId);

        Boolean result = (Boolean) rabbitTemplate.convertSendAndReceive(
                "finalized-competition-exchange",
                "competition.finalized.rpc",
                competitionId
        );

        log.info("Received response from competition service: {}", result);
        return Boolean.TRUE.equals(result);
    }
}
