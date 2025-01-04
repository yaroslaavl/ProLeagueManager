package org.league.app.service;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.TeamRole;
import org.league.app.database.repository.TeamRoleRepository;
import org.league.app.dto.*;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.enums.TeamStatus;
import org.league.app.database.repository.TeamMemberRepository;
import org.league.app.database.repository.TeamRepository;
import org.league.app.exception.*;
import org.league.app.feign.AuthClientFeign;
import org.league.app.feign.NotificationClientFeign;
import org.league.app.feign.NotificationDto;
import org.league.app.feign.UserDto;
import org.league.app.mapper.TeamMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamMapper teamMapper;
    private final TeamRepository teamRepository;
    private final AuthClientFeign authClientFeign;
    private final TeamRoleRepository teamRoleRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final NotificationClientFeign notificationClientFeign;

    @Value("${app.image.uploadDir}")
    private String uploadDir;

    public List<TeamRole> getRolesByNames(String... roleNames) {
        return Arrays.stream(roleNames)
                .map(role -> teamRoleRepository.findByName(role)
                        .orElseThrow(() -> new TeamRoleNotFoundException("Team role does not exist: " + role)))
                .toList();
    }

    @Transactional
    public TeamReadDto createTeam(TeamCreateEditDto teamCreateEditDto) {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        Optional<Team> existingTeam = teamRepository.findTeamByTeamName(teamCreateEditDto.getTeamName());

        if(existingTeam.isPresent()) {
            throw new TeamNameAlreadyExistsException("This teamName is already yours. Please choose another one");
        }

        List<TeamRole> teamRoleList = getRolesByNames("PLAYER", "CAPITAN", "MANAGER");

        Team team = Optional.of(teamCreateEditDto)
                .map(dto -> {
                    Team entity = teamMapper.toEntity(dto);
                    entity.setTeamStatus(TeamStatus.INACTIVE);
                    return entity;
                }).orElseThrow();

        teamRepository.save(team);

        TeamMember teamMember = TeamMember.builder()
                .team(team)
                .userId(userByEmail.getId())
                .roles(teamRoleList)
                .isSubstitute(false)
                .build();

        teamMemberRepository.save(teamMember);

        sendNotificationMessage(userByEmail.getId(),"Your team has been created with name: " + team.getTeamName(), "TEAM_CREATED");
        return teamMapper.toDto(team);
    }

    @Transactional
    public TeamReadDto updateTeamName(TeamCreateEditDto teamCreateEditDto) {
        Team team = getTeamWithAccessCheck();

        if(team.getTeamName().equals(teamCreateEditDto.getTeamName())) {
            throw new TeamNameAlreadyExistsException("This teamName is already yours. Please choose another one");
        }

        Team teamToUpdate = teamRepository.findTeamById(team.getId())
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        teamToUpdate.setTeamName(teamCreateEditDto.getTeamName());

        teamRepository.save(teamToUpdate);
        return teamMapper.toDto(teamToUpdate);
    }

    public TeamMemberDto getTeamByName(String teamName) {
        Team existingTeam = teamRepository.findTeamByTeamName(teamName)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        List<TeamMemberCreateDto> members = teamMemberRepository
                .findTeamMemberByTeamId(existingTeam.getId()).stream()
                .map(member -> {
                    TeamMemberCreateDto dto = new TeamMemberCreateDto();
                    dto.setTeamId(existingTeam.getId());
                    dto.setUserId(member.getUserId());
                    dto.setRoles(member.getRoles());
                    dto.setIsSubstitute(member.getIsSubstitute());
                    dto.setJoinedAt(member.getJoinedAt());
                    return dto;
                })
                .toList();

        TeamReadDto teamReadDto = teamMapper.toDto(existingTeam);
        return new TeamMemberDto(teamReadDto, members);
    }

    public UserTeamStatusDto getUserTeamStatus(UUID teamId) {
        String email = securityContext();

        if(email == null || email.equals("anonymousUser")) {
            return new UserTeamStatusDto(false, null);
        }

        UserDto userByEmail;
        try {
            userByEmail = authClientFeign.getUserByEmail(email);
        } catch (FeignException.Forbidden e) {
            return new UserTeamStatusDto(false, null);
        }

        if (userByEmail == null) {
            return new UserTeamStatusDto(false, null);
        }

        Optional<TeamMember> teamMember = teamMemberRepository.findByTeamIdAndUserId(teamId, userByEmail.getId());

        boolean isMember = teamMember.isPresent();

        List<TeamRole> teamRole = teamMember.map(TeamMember::getRoles).orElse(null);
        return new UserTeamStatusDto(isMember, teamRole);
    }

    @Transactional
    public String uploadTeamLogo(UploadTeamLogoDto uploadTeamLogoDto) throws IOException {
        Team team = getTeamWithAccessCheck();

        log.info("Team found by team name: {}", team);
        MultipartFile file = uploadTeamLogoDto.getTeamLogo();

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is missing or empty. Please provide a valid team logo.");
        }

        String extension = Objects.requireNonNull(file.getOriginalFilename())
                .substring(file.getOriginalFilename().lastIndexOf("."));
        String filename = team.getId() + "_team-logo" + extension;

        String oldFileName = team.getTeamImage();
        if (oldFileName != null && !oldFileName.isEmpty()) {
            Path oldFilePath = Paths.get(uploadDir, oldFileName);
            if (Files.exists(oldFilePath)) {
                Files.delete(oldFilePath);
            }
        }

        Path newFilePath = Paths.get(uploadDir, filename);
        File directory = new File(uploadDir);
        if (!directory.exists()) {
            directory.mkdirs();
        }
        Files.write(newFilePath, file.getBytes());

        team.setTeamImage(filename);
        teamRepository.save(team);

        log.info("Team logo successfully uploaded: {}", filename);
        return filename;
    }

    public byte[] getTeamImage(String teamName) {
        Team existingTeam = teamRepository.findTeamByTeamName(teamName)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        if (existingTeam.getTeamImage() != null) {
            Path path = Paths.get(uploadDir, existingTeam.getTeamImage());
            try {
                return Files.readAllBytes(path);
            } catch (IOException e) {
                log.error("Failed to read team logo: {}", e.getMessage());
            }
        }

        return getDefaultImage();
    }

    private byte[] getDefaultImage() {
        Path defaultImagePath = Paths.get(uploadDir, "default-team-logo.png");
        try {
            return Files.readAllBytes(defaultImagePath);
        } catch (IOException e) {
            log.error("Failed to load default team logo: {}", e.getMessage());
            return new byte[0];
        }
    }

    @Transactional
    public void teamInvitation(Long userId) {
        Team team = getTeamWithAccessCheck();

        Optional<TeamMember> teamMember = teamMemberRepository.findByTeamIdAndUserId(team.getId(), userId);

        if(teamMember.isPresent()) {
            throw new UserAlreadyInThisTeamException("User is already in this team");
        }

        authClientFeign.setToken("User:" + userId + "teamInvitation",team.getId() + "" + userId,1, TimeUnit.DAYS);
        sendNotificationMessage(userId, "You have been invited to join the team: " + team.getTeamName(), "TEAM_INVITATION");
    }

    @Transactional
    public void teamJoinRequest(String teamName) {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        boolean hasMatchingRole = userByEmail.getRoles().stream()
                .anyMatch(role -> role.equals("AUTHORISED_USER"));

        if(!hasMatchingRole) {
            throw new UserEmailIsNotVerifiedException("User email is not verified. Please verify your email first and try again.");
        }

        Team team = teamRepository.findTeamByTeamName(teamName)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        Optional<TeamMember> byTeamIdAndUserId = teamMemberRepository.findByTeamIdAndUserId(team.getId(), userByEmail.getId());

        if(byTeamIdAndUserId.isPresent()) {
            throw new UserAlreadyInThisTeamException("User is already in this team");
        }

        TeamMember teamMember = TeamMember.builder()
                .team(team)
                .userId(userByEmail.getId())
                .roles(getRolesByNames("PLAYER"))
                .isSubstitute(false)
                .build();

        if(authClientFeign.getToken("User:" + userByEmail.getId() + "teamInvitation").equals(team.getId() + "" + userByEmail.getId())) {
            teamMemberRepository.save(teamMember);

            sendNotificationMessage(userByEmail.getId(), "You accepted an invitation to join the team: " + team.getTeamName(), "TEAM_JOINED");
            authClientFeign.deleteToken("User:" + userByEmail.getId() + "teamInvitation");
        }
    }

    @Transactional
    public void kickOutUserFromTeam(Long userId) {
        Team teamWithAccessCheck = getTeamWithAccessCheck();

        Optional<TeamMember> optionalTeamMember = teamMemberRepository.findByTeamIdAndUserId(teamWithAccessCheck.getId(), userId);

        if (optionalTeamMember.isPresent()){
            TeamMember teamMember = optionalTeamMember.get();
            if (teamMember.getRoles().equals(getRolesByNames("MANAGER"))) {
                throw new RuntimeException("You cannot delete yourself from the team");
            }
            teamMemberRepository.delete(teamMember);
        } else {
            log.warn("User with ID {} is not a member of team {}", userId, teamWithAccessCheck.getTeamName());
            throw new UserNotFoundInTeamException("User is not a member of this team");
        }

        sendNotificationMessage(userId, "You have been kicked out of the team: " + teamWithAccessCheck.getTeamName(), "TEAM_KICKED_OUT");
    }

    @Transactional
    public void leaveTeam() {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        Optional<TeamMember> optionalTeamMember = teamMemberRepository.findTeamByUserId(userByEmail.getId());

        if (optionalTeamMember.isPresent()) {
            Team team = optionalTeamMember.get().getTeam();
            List<TeamMember> allMembers = teamMemberRepository.findTeamMemberByTeamId(team.getId());
            TeamMember teamMember = optionalTeamMember.get();
            if (teamMember.getRoles().stream().anyMatch(getRolesByNames("MANAGER")::contains)) {

                if(allMembers.size() == 1) {
                    String teamName = team.getTeamName();
                    sendNotificationMessage(userByEmail.getId(),"You have left the team: " + teamName + " and team is deleted", "TEAM_LEFT_TEAM_DELETED");
                }

                List<TeamMember> teamMemberWithCapitanRole = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("CAPITAN"), team.getId());
                if (teamMemberWithCapitanRole.size() == 1 && teamMember.getRoles().stream().noneMatch(getRolesByNames("CAPITAN")::contains)) {
                    TeamMember teamMemberWithCapitanRoleFirst = teamMemberWithCapitanRole.getFirst();
                    List<TeamRole> currentRoles = new ArrayList<>(teamMemberWithCapitanRoleFirst.getRoles());

                    TeamRole newRole = getRolesByNames("MANAGER").getFirst();
                    if (!currentRoles.contains(newRole)) {
                        currentRoles.add(newRole);
                    }

                    teamMemberWithCapitanRoleFirst.setRoles(currentRoles);
                }

                List<TeamMember> teamMemberWithPlayerRole = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("PLAYER"), team.getId());

                Optional<TeamMember> otherPlayers = teamMemberWithPlayerRole.stream()
                        .filter(member -> !member.getUserId().equals(teamMember.getId()))
                        .findFirst();

                if (otherPlayers.isPresent()) {
                    TeamMember teamMemberWithPlayerRoleFirst = otherPlayers.get();
                    List<TeamRole> currentRoles = new ArrayList<>(teamMemberWithPlayerRoleFirst.getRoles());

                    List<TeamRole> newRoles = getRolesByNames("MANAGER","CAPITAN");
                    for (TeamRole role : newRoles) {
                        if (!currentRoles.contains(role)) {
                            currentRoles.add(role);
                        }
                    }

                    teamMemberWithPlayerRoleFirst.setRoles(currentRoles);
                } else {
                    log.warn("No other players found in team {}", team.getTeamName());
                    throw new UserNotFoundInTeamException("No other players found in team: " + team.getTeamName());
                }
            }

            teamMemberRepository.delete(optionalTeamMember.get());
        }

        sendNotificationMessage(userByEmail.getId(),"You have left the team: " + optionalTeamMember.get().getTeam(), "TEAM_LEFT");
    }

    @Transactional
    public void updateTeamMemberRole(Long playerId, TeamRoleUpdateDto teamRoleUpdateDto) {
        Team teamWithAccessCheck = getTeamWithAccessCheck();

        TeamMember teamMember = teamMemberRepository.findByTeamIdAndUserId(teamWithAccessCheck.getId(), playerId)
                .orElseThrow(() -> new UserNotFoundInTeamException("User is not a member of this team"));

        List<TeamRole> currentRoles = new ArrayList<>(teamMember.getRoles());
        Set<TeamRole> updatedRoles = new HashSet<>(currentRoles);

        if (teamRoleUpdateDto.getRemovedRoles() != null) {
            for (String roleName : teamRoleUpdateDto.getRemovedRoles()) {
                updatedRoles.removeIf(role -> role.getName().equals(roleName));
            }
        }

        List<TeamMember> manager = teamMemberRepository.findTeamMemberByRolesAndTeamId
                (getRolesByNames("MANAGER"), teamWithAccessCheck.getId());
        if(teamRoleUpdateDto.getAddedRoles() != null) {
            for (String roleName : teamRoleUpdateDto.getAddedRoles()) {

                if (roleName.equals("MANAGER")) {
                    if (manager != null && !manager.getFirst().equals(teamMember)) {
                       manager.getFirst().getRoles().remove(getRolesByNames("MANAGER").getFirst());
                       teamMemberRepository.save(manager.getFirst());
                    }
                    updatedRoles.add(getRolesByNames(roleName).getFirst());
                }
                if (roleName.equals("CAPITAN")) {
                    List<TeamMember> capitan = teamMemberRepository.findTeamMemberByRolesAndTeamId
                            (getRolesByNames("CAPITAN"), teamWithAccessCheck.getId());

                    if (capitan != null && !capitan.getFirst().equals(teamMember)) {
                        TeamMember currentCapitan = capitan.getFirst();
                        currentCapitan.getRoles().remove(getRolesByNames("CAPITAN").getFirst());
                        teamMemberRepository.save(currentCapitan);
                    }
                    updatedRoles.add(getRolesByNames("CAPITAN").getFirst());
                    updatedRoles.add(getRolesByNames("PLAYER").getFirst());
                }

                if (!"MANAGER".equals(roleName) && !"CAPITAN".equals(roleName)) {
                    updatedRoles.add(getRolesByNames(roleName).getFirst());
                }
            }
        }

        teamMember.setRoles(new ArrayList<>(updatedRoles));
        teamMemberRepository.save(teamMember);

        sendNotificationMessage(playerId, "Your team member role has been updated.", "TEAM_ROLE_CHANGED");
        sendNotificationMessage(manager.getFirst().getUserId(), "You have changed the role of your team member with ID: " + teamMember.getUserId(), "TEAM_ROLE_CHANGED");
    }

    private void sendNotificationMessage(Long userId, String message, String eventType) {
        NotificationDto notification = NotificationDto.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .message(message)
                .eventType(eventType)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            String notificationCategory = "TEAM";
            notificationClientFeign.sendNotification(notification, notificationCategory);
        } catch (FeignException e) {
            log.error("Failed to send notification: {}", e.getMessage());
            throw new NotificationSendingException("Failed to send notification.");
        }
    }

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto userDto) {
            return userDto.getEmail();
        }
        return authentication.getName();
    }

    private Team getTeamWithAccessCheck() {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());
        Optional<TeamMember> teamByUserId = teamMemberRepository.findTeamByUserId(userByEmail.getId());

        List<TeamMember> isManager = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("MANAGER"), teamByUserId.get().getTeam().getId());

        boolean equals = isManager.getFirst().getUserId().equals(userByEmail.getId());
        if (!equals) {
            throw new NotManagerException("Access denied: You are not a manager of this team.");
        }

        return teamRepository.findTeamByTeamName(teamByUserId.get().getTeam().getTeamName())
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));
    }
}