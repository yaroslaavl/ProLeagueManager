package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.broker.LeagueBracketDto;
import org.league.app.broker.TournamentBracketDto;
import org.league.app.database.repository.MatchRepository;
import org.league.app.dto.MatchReadDto;
import org.league.app.exception.MatchNotFoundException;
import org.league.app.mapper.MatchMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final MatchMapper matchMapper;

    public MatchReadDto findMatchById(UUID id) {
        return matchRepository.findById(id)
                .map(matchMapper::toDto)
                .orElseThrow(() -> new MatchNotFoundException("Match not found"));
    }

    public void generateTournamentBracket(TournamentBracketDto dto) {
        log.info("Generating tournament bracket");
    }

    public void generateLeagueMatches(String info) {
        log.info("Generating league matches");
        throw new RuntimeException("hahahaa");
    }

}
