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

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMqConfig {

    private final String exchange;
    private final String tournamentRoutingKey;
    private final String tournamentQueue;
    private final String tournamentDlq;
    private final String dlx;
    private final String tournamentRoutingKeyForDlx;

    public RabbitMqConfig(@Value("${rabbitmq.exchange}") String exchange,
                          @Value("${rabbitmq.queues.tournament-start.routing-key}") String tournamentRoutingKey,
                          @Value("${rabbitmq.queues.tournament-start.name}") String tournamentQueue,
                          @Value("${rabbitmq.queues.tournament.dead-letter.queue.name}") String tournamentDlq,
                          @Value("${rabbitmq.dead-letter-exchange}") String dlx,
                          @Value("${rabbitmq.queues.tournament-start.routing-key}") String tournamentRoutingKeyForDlx) {
        this.exchange = exchange;
        this.tournamentRoutingKey = tournamentRoutingKey;
        this.tournamentQueue = tournamentQueue;
        this.tournamentDlq = tournamentDlq;
        this.dlx = dlx;
        this.tournamentRoutingKeyForDlx = tournamentRoutingKeyForDlx;
    }

    @Bean
    public DirectExchange directExchange() {
        return new DirectExchange(exchange);
    }

    @Bean
    public Queue tournamentQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", dlx);
        args.put("x-dead-letter-routing-key", tournamentRoutingKeyForDlx);
        return new Queue(tournamentQueue, true, false, false, args);
    }

    @Bean
    public DirectExchange dlxExchange() {
        return new DirectExchange(dlx);
    }

    @Bean
    public Queue tournamentDlq() {
        return new Queue(tournamentDlq, true);
    }

    @Bean
    public Binding dlxBinding() {
        return BindingBuilder.bind(tournamentDlq()).to(dlxExchange()).with(tournamentRoutingKeyForDlx);
    }

    @Bean
    public Binding tournamentBinding() {
        return BindingBuilder.bind(tournamentQueue()).to(directExchange()).with(tournamentRoutingKey);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
