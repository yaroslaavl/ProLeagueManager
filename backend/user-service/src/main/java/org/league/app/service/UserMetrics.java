package org.league.app.service;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Component;

@Component
public class UserMetrics {

    private final MeterRegistry registry;

    public UserMetrics(MeterRegistry registry) {
        this.registry = registry;
    }

    public void countLoginMethodCall() {
        Counter
                .builder("login.method.call.total")
                .description("Total number of login method calls")
                .register(registry)
                .increment();
    }
}
