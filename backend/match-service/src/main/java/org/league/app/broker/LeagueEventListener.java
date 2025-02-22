package org.league.app.broker;

import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.service.MatchService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;


@Slf4j
@Component
@RequiredArgsConstructor
public class LeagueEventListener {

    private final MatchService matchService;

    @SneakyThrows
    @RabbitListener(queues = "league.start.queue")
    public void handleLeagueStartMessage(LeagueBracketDto leagueBracketDtos, Channel channel, @Header(AmqpHeaders.DELIVERY_TAG) long tag) {
        log.info("Received league start event: {}", leagueBracketDtos);

        try {
            matchService.generateLeagueMatches(leagueBracketDtos);
            channel.basicAck(tag, false);
        } catch (Exception e) {
            log.error("Error processing message: {}", e.getMessage());
            channel.basicNack(tag, false, false);
        }
    }
}