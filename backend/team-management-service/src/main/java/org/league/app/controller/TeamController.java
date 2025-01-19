package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.TeamRole;
import org.league.app.database.repository.TeamRoleRepository;
import org.league.app.exception.TeamNotFoundException;
import org.league.app.mapper.TeamMapper;
import org.springframework.data.domain.Page;
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
import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/team")
public class TeamController {

    private final TeamMapper teamMapper;
    private final TeamService teamService;
    private final TeamRepository teamRepository;
    private final TeamRoleRepository teamRoleRepository;

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

    @PutMapping("/update-team-name/{teamId}")
    public ResponseEntity<TeamReadDto> updateTeamName(@PathVariable("teamId") UUID teamId, @RequestBody @Validated(EditAction.class) TeamCreateEditDto teamCreateEditDto) {
        TeamReadDto team = teamService.updateTeamName(teamId, teamCreateEditDto);
        return ResponseEntity.ok(team);
    }

    @GetMapping("/allTeams")
    public Page<TeamReadDto> findAllTeams(@RequestParam("page") int page,
                                          @RequestParam("size") int size,
                                          Pageable pageable) {
        return teamRepository.findAll(pageable).map(teamMapper::toDto);
    }

    @PostMapping("/upload-team-logo/{teamId}")
    public ResponseEntity<String> uploadTeamLogo(@PathVariable("teamId") UUID teamId, @ModelAttribute @Validated({CreateAction.class, EditAction.class}) UploadTeamLogoDto uploadTeamLogoDto) throws IOException {
        return ResponseEntity.ok(teamService.uploadTeamLogo(teamId, uploadTeamLogoDto));
    }

    @GetMapping("/team-logo/{teamName}")
    public ResponseEntity<byte[]> getTeamLogo(@PathVariable("teamName") String teamName) {
        byte[] imageBytes = teamService.getTeamImage(teamName);

        if (imageBytes != null && imageBytes.length > 0) {
            String logo = teamRepository.findTeamByTeamName(teamName).get().getTeamImage();
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

    @PostMapping("/team-invite/{teamId}/{userId}")
    public ResponseEntity<String> teamInvitation(@PathVariable("teamId") UUID teamId,
                                                 @PathVariable("userId") Long userId) {
        teamService.teamInvitation(teamId, userId);
        return ResponseEntity.ok("Invitation sent successfully");
    }

    @PostMapping("/team-join-accept/{teamName}")
    public ResponseEntity<String> teamJoinAccept(@PathVariable("teamName") String teamName) {
        teamService.teamJoinRequest(teamName);
        return ResponseEntity.ok("You accepted the invitation");
    }

    @PutMapping("/team-user-deletion/{teamId}/{id}")
    public String kickOutUserFromTeam(@PathVariable("teamId") UUID teamId,
                                      @PathVariable("id") Long id) {
        teamService.kickOutUserFromTeam(teamId, id);
        return "User deleted from team";
    }

    @PutMapping("/team-leave/{teamName}")
    public String leaveTeam(@PathVariable("teamName") String teamName) {
        teamService.leaveTeam(teamName);
        return "You left team";
    }

    @GetMapping("/get-all-teamRoles")
    public List<TeamRole> getAllRoles() {
        return teamRoleRepository.findAll();
    }

    @PutMapping("/update-role/{teamId}/{playerId}")
    public ResponseEntity<String> updateTeamMemberRole(@PathVariable("teamId") UUID teamId,
                                                       @PathVariable("playerId") Long playerId,
                                                       @RequestBody TeamRoleUpdateDto teamRoleUpdateDto) {
        teamService.updateTeamMemberRole(teamId, playerId, teamRoleUpdateDto);
        return ResponseEntity.ok("Role updated successfully");
    }

    @DeleteMapping("/delete/{teamId}")
    public ResponseEntity<String> deleteTeam(@PathVariable("teamId") UUID teamId) {
        try{
            teamService.deleteTeam(teamId);
            return ResponseEntity.ok("Team deleted successfully");
        } catch (Exception e){
            throw new TeamNotFoundException("Team not found");
        }
    }

    @GetMapping("/get-teams-by-userId")
    public ResponseEntity<List<Team>> findTeamsByUserId(@RequestParam("userId") Long userId){
        return ResponseEntity.ok(teamService.findTeamsByUserId(userId));
    }

    @GetMapping("/get-team-member-by-team-and-userId")
    public ResponseEntity<TeamMember> findTeamMemberByTeamAndUserId(@RequestParam("teamId") UUID teamId, @RequestParam("userId") Long userId) {
        return ResponseEntity.ok(teamService.findByTeamIdAndUserId(teamId,userId));
    }
}
