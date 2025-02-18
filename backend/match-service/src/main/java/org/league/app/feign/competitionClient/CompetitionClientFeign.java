package org.league.app.feign.competitionClient;

import org.league.app.broker.CompetitionDto;
import org.league.app.broker.CompetitionParticipantDto;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.List;
import java.util.UUID;

@FeignClient("competition-management-service")
public interface CompetitionClientFeign {

    @GetMapping("/api/competition/players/{id}")
    List<CompetitionParticipantDto> findCompetitionParticipantsById(@PathVariable("id") UUID id);

    @GetMapping("/api/competition/get/{id}")
    CompetitionDto findById(@PathVariable("id") UUID id);

    @GetMapping("/api/competition/active-tournaments")
    List<UUID> getActiveTournaments();
}
