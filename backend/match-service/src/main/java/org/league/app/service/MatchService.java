package org.league.app.service;

import lombok.RequiredArgsConstructor;
import org.league.app.database.repository.MatchRepository;
import org.league.app.dto.MatchReadDto;
import org.league.app.exception.MatchNotFoundException;
import org.league.app.mapper.MatchMapper;
import org.springframework.stereotype.Service;

import java.util.UUID;

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
}
