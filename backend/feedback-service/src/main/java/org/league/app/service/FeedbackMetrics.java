package org.league.app.service;

import io.micrometer.core.instrument.Gauge;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class FeedbackMetrics {

    private final MeterRegistry meterRegistry;
    private final ConcurrentHashMap<Integer, ValueHolder> holders = new ConcurrentHashMap<>();
    private final Map<String, AtomicInteger> counters = new ConcurrentHashMap<>();

    public FeedbackMetrics(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    public void recordReturnedSize(int days, int size) {
        holders.computeIfAbsent(days, d -> {
            ValueHolder holder = new ValueHolder();
            Gauge.builder("feedback.last.returned.size", holder, ValueHolder::getValue)
                    .description("Last returned size of feedback by days")
                    .tag("days", String.valueOf(days))
                    .register(meterRegistry);
            return holder;
        }).setValue(size);
    }

    public void recordReturnedByTonality(String tonality, long count) {
        counters.computeIfAbsent(tonality, t -> {
            AtomicInteger counter = new AtomicInteger();
            Gauge.builder("feedback.count.by.tonality", counter, AtomicInteger::get)
                    .description("Total feedback count by tonality")
                    .tag("tonality", tonality)
                    .register(meterRegistry);
            return counter;
        }).set((int) count);
    }

    @Setter
    @Getter
    private static class ValueHolder {
        private volatile double value;
    }
}