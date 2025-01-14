package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.repository.SportRepository;
import org.league.app.dto.SportCreateEditDto;
import org.league.app.dto.SportReadDto;
import org.league.app.feign.SportDto;
import org.league.app.service.SportService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

import static java.lang.Boolean.FALSE;
import static java.lang.Boolean.TRUE;
import static org.springframework.http.ResponseEntity.noContent;
import static org.springframework.http.ResponseEntity.notFound;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sport")
public class SportController {

    private final SportService sportService;
    private final SportRepository sportRepository;

    @PostMapping("/create-new-sport")
    public ResponseEntity<SportReadDto> createSport(@RequestBody @Validated(CreateAction.class) SportCreateEditDto sportCreateDto){
        SportReadDto sport = sportService.createSport(sportCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(sport);
    }

    @PutMapping("/edit-sport/{sportName}")
    public ResponseEntity<SportReadDto> editSport(@PathVariable("sportName") String sportName,
                                                  @RequestBody @Validated(EditAction.class) SportCreateEditDto sport) {
        return ResponseEntity.ok(sportService.edit(sportName, sport));
    }

    @DeleteMapping("/delete-sport/{sportName}")
    public ResponseEntity<?> delete(@PathVariable("sportName") String sportName) {
        return sportService.deleteSport(sportName)
                ? noContent().build()
                : notFound().build();
    }

    @GetMapping("/allSports")
    public List<SportReadDto> getSports() {
        return sportService.findAll();
    }

    @GetMapping("/e-sports")
    public List<SportReadDto> getAllESports() {
        return sportService.findAllByIsEsport(TRUE);
    }

    @GetMapping("/regular-sports")
    public List<SportReadDto> getAllRegularSports() {
        return sportService.findAllByIsEsport(FALSE);
    }

    @GetMapping("/exact-sport/{sportName}")
    public SportReadDto findSportByName(@PathVariable("sportName") String sportName) {
        return sportService.findBySportName(sportName);
    }

    @GetMapping("/get-sports-by-name")
    public List<SportDto> findByNameSearch(@RequestParam("sportName") String sportName) {
        return sportRepository.findByNameSearch(sportName)
                .stream()
                .map(sport -> new SportDto(sport.getId(),sport.getName()))
                .collect(Collectors.toList());
    }
}