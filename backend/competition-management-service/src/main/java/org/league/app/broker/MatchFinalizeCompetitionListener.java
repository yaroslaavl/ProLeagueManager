package org.league.app.broker;

import lombok.RequiredArgsConstructor;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import org.league.app.service.CompetitionService;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MatchFinalizeCompetitionListener {

    private final CompetitionService competitionService;

    @SneakyThrows
    @RabbitListener(queues = "finalized-competition-rpc-queue")
    public boolean handleFinalizedCompetition(String competitionId) {
        log.info("Received competition id: {}", competitionId);

        try {
            competitionService.finalizeCompetition(competitionId);
            return true;
        } catch (Exception e) {
            log.error("Error finalizing competition: {}", e.getMessage());
            return false;
        }
    }

}
