package org.league.app.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    private final String tournamentQueue;

    public RabbitMqConfig(
            @Value("${rabbitmq.queue}") String tournamentQueue) {
        this.tournamentQueue = tournamentQueue;
    }

    @Bean
    public Queue tournamentQueue() {
        return new Queue(tournamentQueue, true);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
