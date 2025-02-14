package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class LeagueEventPublisher {

    private final RabbitTemplate rabbitTemplate;

    @Value("${rabbitmq.league.exchange}")
    public String exchange;

    @Value("${rabbitmq.league.queues.start.routing-key}")
    public String leagueRoutingKey;

    public void publishLeagueStartEvent(String info) {
        log.info("Publishing league start event: " + info);
        log.info("Sending league message to generate league start.");
        rabbitTemplate.convertAndSend(exchange, leagueRoutingKey, info);
    }
}