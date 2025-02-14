package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TournamentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.tournament.exchange}")
    public String exchange;

    @Value("${rabbitmq.tournament.queues.start.routing-key}")
    public String tournamentRoutingKey;

    public void publishTournamentStartEvent(TournamentBracketDto tournamentBracketDto) {
        log.info("Sending tournament message to generate tournament bracket");
        rabbitTemplate.convertAndSend(exchange, tournamentRoutingKey, tournamentBracketDto);
    }
}