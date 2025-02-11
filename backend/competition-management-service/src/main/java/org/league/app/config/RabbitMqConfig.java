package org.league.app.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    private final String exchange;
    private final String routingKey;
    private final String tournamentQueue;

    public RabbitMqConfig(
            @Value("${rabbitmq.exchange}") String exchange,
            @Value("${rabbitmq.routing-key}") String routingKey,
            @Value("${rabbitmq.queue}") String tournamentQueue) {
        this.exchange = exchange;
        this.routingKey = routingKey;
        this.tournamentQueue = tournamentQueue;
    }

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(exchange);
    }

    @Bean
    public Queue tournamentQueue() {
        return new Queue(tournamentQueue, true);
    }

    @Bean
    public Binding binding(Queue tournamentQueue, DirectExchange directExchange) {
        return BindingBuilder.bind(tournamentQueue).to(directExchange).with(routingKey);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
