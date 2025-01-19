package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.GameSystem;
import org.league.app.database.repository.GameSystemRepository;
import org.league.app.dto.GameSystemCreateCompetitionDto;
import org.league.app.dto.GameSystemCreateEditDto;
import org.league.app.dto.GameSystemReadDto;
import org.league.app.exception.GameSystemAlreadyExists;
import org.league.app.exception.GameSystemNotFoundException;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.league.app.mapper.GameSystemMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class GameSystemService {

    private final SportClientFeign sportClientFeign;
    private final GameSystemMapper gameSystemMapper;
    private final GameSystemRepository gameSystemRepository;

    @Transactional
    public GameSystemReadDto createGameSystem(GameSystemCreateEditDto gameSystemCreateEditDto) {
        if(gameSystemRepository.findGameSystemBySystemName(gameSystemCreateEditDto.getSystemName()).isPresent()){
            throw new GameSystemAlreadyExists("Game system already exists");
        }

        GameSystem gameSystem = Optional.of(gameSystemCreateEditDto)
                .map(gameSystemMapper::toEntity)
                .orElseThrow(() -> new IllegalArgumentException("Bad mapping"));

        gameSystemRepository.save(gameSystem);
        return gameSystemMapper.toDto(gameSystem);
    }

    public GameSystemReadDto getGameSystemById(Integer id) {
        GameSystem gameSystem = gameSystemRepository.findById(id)
                .orElseThrow(() -> new GameSystemNotFoundException("Game system not found"));

        return gameSystemMapper.toDto(gameSystem);
    }

    @Transactional
    public void deleteGameSystemById(Integer id) {
        GameSystem gameSystem = gameSystemRepository.findById(id)
                .orElseThrow(() -> new GameSystemNotFoundException("Game system not found"));

        log.info("Deleting game system: {}", gameSystem);
        gameSystemRepository.delete(gameSystem);
    }

    public List<GameSystemCreateCompetitionDto> searchGameSystem(String query) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        List<SportDto> sports = sportClientFeign.findByNameSearch(query);

        if (sports.isEmpty()) {
            return Collections.emptyList();
        }

        List<Integer> sportIds = sports.stream()
                .map(SportDto::getId)
                .collect(Collectors.toList());
        List<GameSystem> gameSystemsBySport = gameSystemRepository.findAllBySportIdIn(sportIds);

        if (gameSystemsBySport.isEmpty()) {
            return Collections.emptyList();
        }

        Map<Integer, String> sportIdToNameMap = sports.stream()
                .collect(Collectors.toMap(SportDto::getId, SportDto::getName));

        Map<Integer, Boolean> sportIdToSportTypeMap = sports.stream()
                .collect(Collectors.toMap(SportDto::getId,SportDto::getIsEsport));

        return gameSystemsBySport.stream()
                .map(gameSystem -> GameSystemCreateCompetitionDto.builder()
                        .systemId(gameSystem.getId())
                        .systemName(gameSystem.getSystemName())
                        .isIndividual(gameSystem.getIsIndividual())
                        .sportId(gameSystem.getSportId())
                        .sportName(sportIdToNameMap.getOrDefault(gameSystem.getSportId(), ""))
                        .isEsport(sportIdToSportTypeMap.getOrDefault(gameSystem.getSportId(), false))
                        .build())
                .collect(Collectors.toList());
    }
}
