package org.league.app.config;

import org.springframework.amqp.core.*;
import org.springframework.amqp.rabbit.config.SimpleRabbitListenerContainerFactory;
import org.springframework.amqp.rabbit.connection.ConnectionFactory;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.amqp.support.converter.MessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Bean
    public SimpleRabbitListenerContainerFactory rabbitListenerContainerFactory(ConnectionFactory connectionFactory) {
        SimpleRabbitListenerContainerFactory factory = new SimpleRabbitListenerContainerFactory();
        factory.setConnectionFactory(connectionFactory);
        factory.setAcknowledgeMode(AcknowledgeMode.MANUAL);
        factory.setPrefetchCount(1);
        factory.setConcurrentConsumers(5);
        factory.setMaxConcurrentConsumers(10);
        factory.setMessageConverter(messageConverter());
        return factory;
    }

    @Bean
    public MessageConverter messageConverter() {
        return new Jackson2JsonMessageConverter();
    }

    @Bean
    public DirectExchange finalizedCompetitionExchange() {
        return new DirectExchange("finalized-competition-exchange");
    }

    @Bean
    public Queue finalizedCompetitionQueue() {
        return new Queue("finalized-competition-rpc-queue", true, false, false);
    }

    @Bean
    public Binding finalizedCompetitionBinding(Queue rpcQueue, DirectExchange finalizedCompetitionExchange) {
        return BindingBuilder.bind(rpcQueue).to(finalizedCompetitionExchange).with("competition.finalized.rpc");
    }
}
