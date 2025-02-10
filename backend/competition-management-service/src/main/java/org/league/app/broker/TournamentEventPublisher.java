package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class TournamentEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.exchange}")
    public String exchange;

    @Value("${rabbitmq.routing-key}")
    public String routingKey;

    public void publishTournamentStartEvent(UUID competitionId) {
        log.info("Sending tournament start event");
        rabbitTemplate.convertAndSend(exchange, routingKey, competitionId);
    }
}
