package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.mapper.TeamMapper;
import org.springframework.data.domain.Page;
import org.league.app.database.entity.Team;
import org.league.app.database.repository.TeamRepository;
import org.league.app.dto.*;
import org.league.app.service.TeamService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;
import java.io.IOException;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/team")
public class TeamController {

    private final TeamMapper teamMapper;
    private final TeamService teamService;
    private final TeamRepository teamRepository;

    @PostMapping("/create-team")
    public ResponseEntity<TeamReadDto> createTeam(@RequestBody @Validated(CreateAction.class) TeamCreateEditDto teamCreateDto) {
        TeamReadDto team = teamService.createTeam(teamCreateDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(team);
    }

    @GetMapping("/currentTeam/{teamName}")
    public ResponseEntity<TeamMemberDto> getTeamByName(@PathVariable("teamName") String teamName) {
        TeamMemberDto team = teamService.getTeamByName(teamName);
        return ResponseEntity.ok(team);
    }

    @GetMapping("/{teamId}/user-role")
    public ResponseEntity<UserTeamStatusDto> getUserTeamRole(@PathVariable("teamId") UUID teamId) {
        UserTeamStatusDto userTeamStatusDto = teamService.getUserTeamStatus(teamId);
        return ResponseEntity.ok(userTeamStatusDto);
    }

    @PutMapping("/update-team-name")
    public ResponseEntity<TeamReadDto> updateTeamName(@RequestBody @Validated(EditAction.class) TeamCreateEditDto teamCreateEditDto) {
        TeamReadDto team = teamService.updateTeamName(teamCreateEditDto);
        return ResponseEntity.ok(team);
    }

    @GetMapping("/allTeams")
    public Page<TeamReadDto> findAllTeams(@RequestParam("page") int page,
                                          @RequestParam("size") int size,
                                          Pageable pageable) {
        return teamRepository.findAll(pageable).map(teamMapper::toDto);
    }

    @PostMapping("/upload-team-logo")
    public ResponseEntity<String> uploadTeamLogo(@ModelAttribute @Validated({CreateAction.class, EditAction.class}) UploadTeamLogoDto uploadTeamLogoDto) throws IOException {
        return ResponseEntity.ok(teamService.uploadTeamLogo(uploadTeamLogoDto));
    }

    @GetMapping("/team-logo/{teamName}")
    public ResponseEntity<byte[]> getTeamLogo(@PathVariable("teamName") String teamName) {
        byte[] imageBytes = teamService.getTeamImage(teamName);

        if (imageBytes != null && imageBytes.length > 0) {
            String logo = teamRepository.findTeamByTeamName(teamName).getTeamImage();
            String fileExtension = (logo != null && logo.contains("."))
                    ? logo.substring(logo.lastIndexOf(".") + 1).toLowerCase()
                    : "png";

            String contentType = switch (fileExtension) {
                case "jpg", "jpeg" -> "image/jpeg";
                case "png" -> "image/png";
                case "svg" -> "image/svg+xml";
                default -> "application/octet-stream";
            };

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(imageBytes);
        }

        return ResponseEntity.notFound().build();
    }

}
