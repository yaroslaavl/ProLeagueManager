package org.league.app.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class RabbitMqConfig {

    private final String tournamentExchange;
    private final String tournamentDlxExchange;
    private final String tournamentQueueName;
    private final String tournamentRoutingKey;
    private final String tournamentDlxRoutingKey;
    private final String tournamentDlqName;

    private final String leagueExchange;
    private final String leagueDlxExchange;
    private final String leagueQueueName;
    private final String leagueRoutingKey;
    private final String leagueDlxRoutingKey;
    private final String leagueDlqName;

    public RabbitMqConfig(@Value("${rabbitmq.tournament.exchange}") String tournamentExchange,
                          @Value("${rabbitmq.tournament.dead-letter-exchange}") String tournamentDlxExchange,
                          @Value("${rabbitmq.tournament.queues.start.name}") String tournamentQueueName,
                          @Value("${rabbitmq.tournament.queues.start.routing-key}") String tournamentRoutingKey,
                          @Value("${rabbitmq.tournament.queues.start.arguments.x-dead-letter-routing-key}") String tournamentDlxRoutingKey,
                          @Value("${rabbitmq.tournament.queues.dead-letter.queue.name}") String tournamentDlqName,

                          @Value("${rabbitmq.league.exchange}") String leagueExchange,
                          @Value("${rabbitmq.league.dead-letter-exchange}") String leagueDlxExchange,
                          @Value("${rabbitmq.league.queues.start.name}") String leagueQueueName,
                          @Value("${rabbitmq.league.queues.start.routing-key}") String leagueRoutingKey,
                          @Value("${rabbitmq.league.queues.start.arguments.x-dead-letter-routing-key}") String leagueDlxRoutingKey,
                          @Value("${rabbitmq.league.queues.dead-letter.queue.name}") String leagueDlqName) {

        this.tournamentExchange = tournamentExchange;
        this.tournamentDlxExchange = tournamentDlxExchange;
        this.tournamentQueueName = tournamentQueueName;
        this.tournamentRoutingKey = tournamentRoutingKey;
        this.tournamentDlxRoutingKey = tournamentDlxRoutingKey;
        this.tournamentDlqName = tournamentDlqName;

        this.leagueExchange = leagueExchange;
        this.leagueDlxExchange = leagueDlxExchange;
        this.leagueQueueName = leagueQueueName;
        this.leagueRoutingKey = leagueRoutingKey;
        this.leagueDlxRoutingKey = leagueDlxRoutingKey;
        this.leagueDlqName = leagueDlqName;
    }

    @Bean
    public DirectExchange tournamentExchange() {
        return new DirectExchange(tournamentExchange);
    }

    @Bean
    public DirectExchange tournamentDlx() {
        return new DirectExchange(tournamentDlxExchange);
    }

    @Bean
    public Queue tournamentQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", tournamentDlxExchange);
        args.put("x-dead-letter-routing-key", tournamentDlxRoutingKey);
        return new Queue(tournamentQueueName, true, false, false, args);
    }

    @Bean
    public Queue tournamentDlq() {
        return new Queue(tournamentDlqName, true);
    }

    @Bean
    public Binding tournamentBinding(
            @Qualifier("tournamentQueue") Queue tQueue,
            @Qualifier("tournamentExchange") DirectExchange tExchange
    ) {
        return BindingBuilder.bind(tQueue).to(tExchange).with(tournamentRoutingKey);
    }

    @Bean
    public Binding tournamentDlqBinding(
            @Qualifier("tournamentDlq") Queue tDlq,
            @Qualifier("tournamentDlx") DirectExchange tDlx
    ) {
        return BindingBuilder.bind(tDlq).to(tDlx).with(tournamentDlxRoutingKey);
    }


    @Bean
    public DirectExchange leagueExchange() {
        return new DirectExchange(leagueExchange);
    }

    @Bean
    public DirectExchange leagueDlx() {
        return new DirectExchange(leagueDlxExchange);
    }

    @Bean
    public Queue leagueQueue() {
        Map<String, Object> args = new HashMap<>();
        args.put("x-dead-letter-exchange", leagueDlxExchange);
        args.put("x-dead-letter-routing-key", leagueDlxRoutingKey);
        return new Queue(leagueQueueName, true, false, false, args);
    }

    @Bean
    public Queue leagueDlq() {
        return new Queue(leagueDlqName, true);
    }

    @Bean
    public Binding leagueBinding(
            @Qualifier("leagueQueue") Queue lQueue,
            @Qualifier("leagueExchange") DirectExchange lExchange
    ) {
        return BindingBuilder.bind(lQueue).to(lExchange).with(leagueRoutingKey);
    }

    @Bean
    public Binding leagueDlqBinding(
            @Qualifier("leagueDlq") Queue lDlq,
            @Qualifier("leagueDlx") DirectExchange lDlx
    ) {
        return BindingBuilder.bind(lDlq).to(lDlx).with(leagueDlxRoutingKey);
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
