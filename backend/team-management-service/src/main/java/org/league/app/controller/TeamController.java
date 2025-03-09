package org.league.app.controller;

import lombok.RequiredArgsConstructor;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.TeamRole;
import org.league.app.database.repository.TeamRoleRepository;
import org.league.app.exception.TeamNotFoundException;
import org.league.app.feign.teamClietnt.TeamFeignDto;
import org.league.app.mapper.TeamMapper;
import org.league.app.service.MinioService;
import org.springframework.data.domain.Page;
import org.league.app.database.repository.TeamRepository;
import org.league.app.dto.*;
import org.league.app.service.TeamService;
import org.league.app.validation.CreateAction;
import org.league.app.validation.EditAction;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Pageable;

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
    private final MinioService minioService;

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
    public ResponseEntity<TeamReadDto> updateTeamName(@PathVariable("teamId") UUID teamId,
                                                      @RequestBody @Validated(EditAction.class) TeamCreateEditDto teamCreateEditDto) {
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
    public void uploadTeamLogo(@PathVariable("teamId") UUID teamId,
                               @Validated({CreateAction.class, EditAction.class}) UploadTeamLogoDto uploadTeamLogoDto) {
        minioService.uploadImage(teamId, uploadTeamLogoDto);
    }

    @GetMapping("/team-logo/{teamId}")
    public ResponseEntity<String> getTeamLogo(@PathVariable("teamId") UUID teamId) {
        return ResponseEntity.ok(minioService.getTeamLogo(teamId));
    }

    @PostMapping("/invite/{teamId}/{userId}")
    public ResponseEntity<String> teamInvitation(@PathVariable("teamId") UUID teamId,
                                                 @PathVariable("userId") Long userId) {
        teamService.teamInvitation(teamId, userId);
        return ResponseEntity.ok("Invitation sent successfully");
    }

    @PostMapping("/join-accept/{teamName}")
    public ResponseEntity<String> teamJoinAccept(@PathVariable("teamName") String teamName) {
        teamService.teamJoinRequest(teamName);
        return ResponseEntity.ok("You accepted the invitation");
    }

    @PutMapping("/user-deletion/{teamId}/{id}")
    public String kickOutUserFromTeam(@PathVariable("teamId") UUID teamId,
                                      @PathVariable("id") Long id) {
        teamService.kickOutUserFromTeam(teamId, id);
        return "User deleted from team";
    }

    @PutMapping("/leave/{teamName}")
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
        try {
            teamService.deleteTeam(teamId);
            return ResponseEntity.ok("Team deleted successfully");
        } catch (Exception e) {
            throw new TeamNotFoundException("Team not found");
        }
    }

    @GetMapping("/get-teams-by-userId")
    public ResponseEntity<List<Team>> findTeamsByUserId(@RequestParam("userId") Long userId) {
        return ResponseEntity.ok(teamService.findTeamsByUserId(userId));
    }

    @GetMapping("/get-team-member-by-team-and-userId")
    public ResponseEntity<TeamMember> findTeamMemberByTeamAndUserId(@RequestParam("teamId") UUID teamId, @RequestParam("userId") Long userId) {
        return ResponseEntity.ok(teamService.findByTeamIdAndUserId(teamId, userId));
    }

    @GetMapping("/managed")
    public ResponseEntity<List<TeamReadDto>> findTeamsWhereUserIsManager(@RequestParam("id") Long userId) {
        List<Team> teams = teamService.findTeamWhereUserIsManager(userId);
        List<TeamReadDto> collect = teams.stream()
                .map(teamMapper::toDto)
                .toList();
        return ResponseEntity.ok(collect);
    }

    @GetMapping("/current/{id}")
    public ResponseEntity<TeamFeignDto> findTeamById(@PathVariable("id") UUID id) {
        Team teamById = teamRepository.findTeamById(id)
                .orElseThrow(() -> new TeamNotFoundException("Team not found"));

        TeamFeignDto teamFeignDto = teamMapper.toTeamFeignDto(teamById);
        return ResponseEntity.ok(teamFeignDto);
    }

    @PostMapping("/join-reject/{teamName}")
    public ResponseEntity<String> teamJoinReject(@PathVariable("teamName") String teamName) {
        teamService.teamRejectRequest(teamName);
        return ResponseEntity.ok("You rejected the invitation");
    }

    @PostMapping("/revoke-join-request/{teamId}")
    public ResponseEntity<String> revokeTeamJoinRequest(@PathVariable("teamId") UUID teamId,
                                                        @RequestParam("userId") Long userId) {
        teamService.revokeTeamJoinRequest(teamId, userId);
        return ResponseEntity.ok("You revoked the invitation");

    }

    @GetMapping("/search-team")
    public ResponseEntity<List<TeamReadDto>> findAllTeamsByFiltersByDynamicSearch (
            @RequestParam(required = false, name = "keyword") String keyword,
            @RequestParam(required = false, name = "teamStatus") String teamStatus) {
        List<TeamReadDto> allTeams = teamService.searchTeamByFilter(keyword, teamStatus);

        return ResponseEntity.ok(allTeams);
    }
}
