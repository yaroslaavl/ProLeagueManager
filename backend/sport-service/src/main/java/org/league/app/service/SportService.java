package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Sport;
import org.league.app.database.repository.SportRepository;
import org.league.app.dto.SportCreateEditDto;
import org.league.app.dto.SportReadDto;
import org.league.app.exception.SportAlreadyExists;
import org.league.app.exception.SportNotFoundException;
import org.league.app.mapper.SportMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SportService {

    private final SportMapper sportMapper;
    private final SportRepository sportRepository;

    @Transactional
    public SportReadDto createSport(SportCreateEditDto sportCreateDto) {
        if (sportRepository.findByName(sportCreateDto.getName()).isPresent()) {
            throw new SportAlreadyExists("Sport already exists");
        }

        Sport sport = Optional.of(sportCreateDto)
                .map(sportMapper::toEntity)
                .orElseThrow(() -> new IllegalArgumentException("Bad mapping"));

        sport.setName(sport.getName().trim().replaceAll("\\s+", ""));
        sportRepository.save(sport);
        return sportMapper.toDto(sport);
    }

    public List<SportReadDto> findAll() {
        return sportRepository.findAll().stream()
                .map(sportMapper::toDto)
                .toList();
    }

    public SportReadDto findBySportName(String sportName) {
        return sportRepository.findByName(sportName.trim().replaceAll("\\s+", ""))
                .map(sportMapper::toDto)
                .orElseThrow(() -> new SportNotFoundException("Sport not found: " + sportName));
    }

    @Transactional
    public SportReadDto edit(String sportName, SportCreateEditDto sportCreateEditDto) {
        Sport sport = sportRepository.findByName(sportName)
                .orElseThrow(() -> new SportNotFoundException("Sport not found: " + sportName));

        if (sportRepository.findByName(sportCreateEditDto.getName()).isPresent()) {
            throw new SportAlreadyExists("Sport already exists: " + sportCreateEditDto.getName());
        }

        Optional.ofNullable(sportCreateEditDto.getName()).ifPresent(sport::setName);
        Optional.ofNullable(sportCreateEditDto.getIsEsport()).ifPresent(sport::setIsEsport);

        sportRepository.save(sport);
        return sportMapper.toDto(sport);
    }

    @Transactional
    public boolean deleteSport(String sportName) {
        return sportRepository.findByName(sportName)
                .map(entity -> {
                    int deleted = sportRepository.deleteSportByName(entity.getName());
                    sportRepository.flush();
                    return deleted > 0;
                })
                .orElse(false);
    }

    public List<SportReadDto> findAllByIsEsport(Boolean isEsport) {
        return sportRepository.findAll().stream()
                .filter(entity -> entity.getIsEsport().equals(isEsport))
                .map(sportMapper::toDto)
                .collect(Collectors.toList());
    }

}