package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.GameSystem;
import org.league.app.database.repository.GameSystemRepository;
import org.league.app.dto.GameSystemCreateEditDto;
import org.league.app.dto.GameSystemReadDto;
import org.league.app.exception.GameSystemAlreadyExists;
import org.league.app.exception.GameSystemNotFoundException;
import org.league.app.mapper.GameSystemMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameSystemService {

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

    public GameSystemReadDto getGameSystem(String systemName) {
        GameSystem gameSystem = gameSystemRepository.findGameSystemBySystemName(systemName)
                .orElseThrow(() -> new GameSystemNotFoundException("Game system not found"));

        return gameSystemMapper.toDto(gameSystem);
    }




}
