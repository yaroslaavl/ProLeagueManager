package org.league.app.controller;

import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.repository.UserRepository;
import org.league.app.dto.UserCreateEditDto;
import org.league.app.dto.UserReadDto;
import org.league.app.service.UserService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@AllArgsConstructor
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PostMapping("/registration")
    public ResponseEntity<UserReadDto> registration(@RequestBody @Validated({CreateAction.class, EditAction.class}) UserCreateEditDto userCreateEditDto, BindingResult bindingResult){
        if(userRepository.existsByEmail(userCreateEditDto.getEmail()) && userRepository.existsByUsername(userCreateEditDto.getUsername())){
            log.error("'{}' is already registered",userCreateEditDto.getEmail());
            log.error("'{}' is already in use",userCreateEditDto.getUsername());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        if(userRepository.existsByEmail(userCreateEditDto.getEmail()) || userRepository.existsByUsername(userCreateEditDto.getUsername())){
            log.error("'{}' is already exist",
                    userRepository.existsByEmail(userCreateEditDto.getEmail()) ? userCreateEditDto.getEmail() : userCreateEditDto.getUsername());
            return new ResponseEntity<>(HttpStatus.CONFLICT);
        }

        if(bindingResult.hasErrors()){
            bindingResult.getFieldErrors().forEach(fieldError -> log.error(fieldError.getField() + ": " + fieldError.getDefaultMessage()));
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        var userReadDto = userService.create(userCreateEditDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(userReadDto);
    }

    @GetMapping("/activate")
    public ResponseEntity<Boolean> activate(@RequestParam("token") String token){
        boolean confirmation = userService.emailConfirmation(token);
        log.info("'{}' is activated",token);
        return ResponseEntity.ok(confirmation);
    }
}
