package org.league.app.service;

import feign.FeignException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.TeamRole;
import org.league.app.database.repository.TeamRoleRepository;
import org.league.app.database.specification.TeamSpecification;
import org.league.app.dto.*;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.enums.TeamStatus;
import org.league.app.database.repository.TeamMemberRepository;
import org.league.app.database.repository.TeamRepository;
import org.league.app.exception.*;
import org.league.app.feign.authClient.AuthClientFeign;
import org.league.app.feign.notificationClient.NotificationClientFeign;
import org.league.app.feign.notificationClient.NotificationDto;
import org.league.app.feign.authClient.UserDto;
import org.league.app.mapper.TeamMapper;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

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

    @Transactional
    public TeamReadDto createTeam(TeamCreateEditDto teamCreateEditDto) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

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
                .build();

        teamMemberRepository.save(teamMember);

        sendNotificationMessage(userByEmail.getId(), null, null, "Your team has been created with name: " + team.getTeamName(), "TEAM_CREATED");
        return teamMapper.toDto(team);
    }

    @Transactional
    public TeamReadDto updateTeamName(UUID teamId, TeamCreateEditDto teamCreateEditDto) {
        Team team = getTeamWithAccessCheck(teamId);

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
            userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), email);
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
    public void teamInvitation(UUID teamId, Long userId) {
        Team team = getTeamWithAccessCheck(teamId);
        String token = authClientFeign.getToken("User:" + userId + "teamInvitation");

        if (token != null && !token.isEmpty()) {
            throw new InvitationException("User already received the invitation");

        }

        Optional<TeamMember> teamMember = teamMemberRepository.findByTeamIdAndUserId(team.getId(), userId);

        if(teamMember.isPresent()) {
            throw new UserAlreadyInThisTeamException("User is already in this team");
        }

        UserDto userDto = authClientFeign.getUserDto(userId);
        authClientFeign.setToken("User:" + userId + "teamInvitation",team.getId() + "" + userId,1, TimeUnit.DAYS);

        List<TeamMember> managers = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("MANAGER"), team.getId());
        if (managers.isEmpty()) {
            throw new NotManagerException("Team has no manager, cannot send invitation.");
        }
        TeamMember manager = managers.getFirst();

        sendNotificationMessage(manager.getUserId(), userId, teamId, "Manager invited " + userDto.getEmail() + " to team: " + team.getTeamName(), "PLAYER_INVITED");
        sendNotificationMessage(userId, null, null, "You have been invited to join the team: " + team.getTeamName(), "TEAM_INVITATION");
    }

    @Transactional
    public void teamJoinRequest(String teamName) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

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
                .build();

        if(authClientFeign.getToken("User:" + userByEmail.getId() + "teamInvitation").equals(team.getId() + "" + userByEmail.getId())) {
            teamMemberRepository.save(teamMember);

            List<TeamMember> managers = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("MANAGER"), team.getId());
            if (managers.isEmpty()) {
                throw new NotManagerException("Team has no manager, cannot send invitation.");
            }
            TeamMember manager = managers.getFirst();

            sendNotificationMessage(userByEmail.getId(), null, null, "You accepted an invitation to join the team: " + team.getTeamName(), "TEAM_JOINED");
            sendNotificationMessage(manager.getUserId(), null, team.getId(), userByEmail.getEmail() + " joined to team: " + team.getTeamName(), "PLAYER_JOINED");

            notificationClientFeign.deleteTeamNotifications(
                    getTokenFromRequest(),
                    team.getId(),
                    userByEmail.getId());

            authClientFeign.deleteToken("User:" + userByEmail.getId() + "teamInvitation");
        }
    }

    public void teamRejectRequest(String teamName) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        Team team = teamRepository.findTeamByTeamName(teamName)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        String token = authClientFeign.getToken("User:" + userByEmail.getId() + "teamInvitation");
        if (token == null || !token.equals(team.getId() + "" + userByEmail.getId())) {
            throw new InvitationException("No valid invitation found.");
        }

        List<TeamMember> managers = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("MANAGER"), team.getId());
        if (managers.isEmpty()) {
            throw new NotManagerException("Team has no manager, cannot send invitation.");
        }
        TeamMember manager = managers.getFirst();

        authClientFeign.deleteToken("User:" + userByEmail.getId() + "teamInvitation");
        sendNotificationMessage(userByEmail.getId(), null, null,
                "You have rejected the invitation to join the team: " + team.getTeamName(),
                "TEAM_INVITATION_REJECTED");

        sendNotificationMessage(manager.getUserId(),null, team.getId(),
                userByEmail.getEmail() + " has rejected the invitation to join your team: " + team.getTeamName(),
                "PLAYER_INVITATION_REJECTED");

        notificationClientFeign.deleteTeamNotifications(
                getTokenFromRequest(),
                team.getId(),
                userByEmail.getId());
    }

    public void revokeTeamJoinRequest(UUID teamId, Long userId) {
        Team team = getTeamWithAccessCheck(teamId);

        String token = authClientFeign.getToken("User:" + userId + "teamInvitation");
        if (token == null || !token.equals(team.getId() + "" + userId)) {
            throw new InvitationException("No valid invitation found.");
        }

        notificationClientFeign.deleteTeamNotifications(
                getTokenFromRequest(),
                team.getId(),
                userId);

        authClientFeign.deleteToken("User:" + userId + "teamInvitation");
        sendNotificationMessage(
                userId,
                null,
                null,
                "You received a request to join the team: " + team.getTeamName() + ", but the manager revoked the request", "TEAM_JOIN_REQUEST_REVOKED");
    }

    @Transactional
    public void kickOutUserFromTeam(UUID teamId, Long userId) {
        Team teamWithAccessCheck = getTeamWithAccessCheck(teamId);

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

        sendNotificationMessage(userId, null, null, "You have been kicked out of the team: " + teamWithAccessCheck.getTeamName(), "TEAM_KICKED_OUT");
    }

    public List<Team> findTeamsByUserId(Long userId) {
        List<TeamMember> userTeams = teamMemberRepository.findTeamsByUserId(userId);
        return userTeams.stream().map(TeamMember::getTeam).collect(Collectors.toList());
    }

    public TeamMember findByTeamIdAndUserId(UUID teamId, Long userId) {
        return teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));
    }

    @Transactional
    public void leaveTeam(String teamName) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());

        Team teamByTeamName = teamRepository.findTeamByTeamName(teamName)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        Optional<TeamMember> optionalTeamMember = teamMemberRepository.findByTeamIdAndUserId(teamByTeamName.getId(), userByEmail.getId());

        List<TeamMember> allMembers = teamMemberRepository.findTeamMemberByTeamId(teamByTeamName.getId());
        TeamMember teamMember = optionalTeamMember.get();
        if (teamMember.getRoles().stream().anyMatch(getRolesByNames("MANAGER")::contains)) {

            if (allMembers.size() == 1) {
                String teamGetName = teamByTeamName.getTeamName();
                teamRepository.delete(teamByTeamName);
                sendNotificationMessage(userByEmail.getId(), null, null, "You have left the team: " + teamGetName + " and team is deleted", "TEAM_LEFT_TEAM_DELETED");
                return;
            }

            List<TeamMember> teamMemberWithCapitanRole = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("CAPITAN"), teamByTeamName.getId());
            if (teamMemberWithCapitanRole.size() == 1 && teamMember.getRoles().stream().noneMatch(getRolesByNames("CAPITAN")::contains)) {
                TeamMember teamMemberWithCapitanRoleFirst = teamMemberWithCapitanRole.getFirst();
                List<TeamRole> currentRoles = new ArrayList<>(teamMemberWithCapitanRoleFirst.getRoles());

                TeamRole newRole = getRolesByNames("MANAGER").getFirst();
                if (!currentRoles.contains(newRole)) {
                    currentRoles.add(newRole);
                }

                teamMemberWithCapitanRoleFirst.setRoles(currentRoles);
            }

            List<TeamMember> teamMemberWithPlayerRole = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("PLAYER"), teamByTeamName.getId());

            Optional<TeamMember> otherPlayers = teamMemberWithPlayerRole.stream()
                    .filter(member -> !member.getUserId().equals(teamMember.getId()))
                    .findFirst();

            if (otherPlayers.isPresent()) {
                TeamMember teamMemberWithPlayerRoleFirst = otherPlayers.get();
                List<TeamRole> currentRoles = new ArrayList<>(teamMemberWithPlayerRoleFirst.getRoles());

                List<TeamRole> newRoles = getRolesByNames("MANAGER", "CAPITAN");
                for (TeamRole role : newRoles) {
                    if (!currentRoles.contains(role)) {
                        currentRoles.add(role);
                    }
                }

                teamMemberWithPlayerRoleFirst.setRoles(currentRoles);
            } else {
                log.warn("No other players found in team {}", teamByTeamName.getTeamName());
                throw new UserNotFoundInTeamException("No other players found in team: " + teamByTeamName.getTeamName());
            }
        }
        teamMemberRepository.delete(optionalTeamMember.get());
        sendNotificationMessage(userByEmail.getId(), null, null, "You have left the team: " + optionalTeamMember.get().getTeam(), "TEAM_LEFT");
    }

    @Transactional
    public void updateTeamMemberRole(UUID teamId, Long playerId, TeamRoleUpdateDto teamRoleUpdateDto) {
        Team teamWithAccessCheck = getTeamWithAccessCheck(teamId);

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
        UserDto userDto = authClientFeign.getUserDto(teamMember.getUserId());
        sendNotificationMessage(playerId, null, null, "Your team member role has been updated.", "TEAM_ROLE_CHANGED");
        sendNotificationMessage(manager.getFirst().getUserId(), null, teamId,"You have changed the role of your team member with email: " + userDto.getEmail(), "TEAM_ROLE_CHANGED");
    }

    @Transactional
    public void deleteTeam(UUID teamId) {
        Team team = getTeamWithAccessCheck(teamId);
        teamRepository.delete(team);
    }

    public List<Team> findTeamWhereUserIsManager(Long userId) {
        List<TeamMember> teamMembers = teamMemberRepository.findTeamMemberByRolesAndUserId((getRolesByNames("MANAGER")), userId);
        return teamMembers.stream().map(TeamMember::getTeam).collect(Collectors.toList());
    }
    
    public List<TeamReadDto> searchTeamByFilter(String keyword, String teamStatus) {
        Specification<Team> specification = Specification
                .where(TeamSpecification.search(keyword))
                .and(TeamSpecification.hasStatus(teamStatus));

        return teamRepository.findAll(specification).stream().map(teamMapper::toDto).toList();
    }

    private void sendNotificationMessage(Long userId, Long targetUserId, UUID teamId, String message, String eventType) {
        NotificationDto notification = NotificationDto.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .targetUserId(targetUserId)
                .teamId(teamId)
                .message(message)
                .eventType(eventType)
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        try {
            String notificationCategory = "TEAM";
            notificationClientFeign.sendNotification(getTokenFromRequest(), notification, notificationCategory);
        } catch (FeignException e) {
            log.error("Failed to send notification: {}", e.getMessage());
            throw new NotificationSendingException("Failed to send notification.");
        }
    }

    private String getTokenFromRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes != null) {
            HttpServletRequest request = attributes.getRequest();
            return request.getHeader("Authorization");
        }
        return null;
    }

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto userDto) {
            return userDto.getEmail();
        }
        return authentication.getName();
    }

    public Team getTeamWithAccessCheck(UUID teamId) {
        UserDto userByEmail = authClientFeign.getUserByEmail(getTokenFromRequest(), securityContext());
        Team teamById = teamRepository.findTeamById(teamId)
                .orElseThrow(() -> new TeamNotFoundException("Team does not exist"));

        List<TeamMember> isManager = teamMemberRepository.findTeamMemberByRolesAndTeamId(getRolesByNames("MANAGER"), teamById.getId());

        boolean equals = isManager.getFirst().getUserId().equals(userByEmail.getId());
        if (!equals) {
            throw new NotManagerException("Access denied: You are not a manager of this team.");
        }

        return teamById;
    }

    private List<TeamRole> getRolesByNames(String... roleNames) {
        return Arrays.stream(roleNames)
                .map(role -> teamRoleRepository.findByName(role)
                        .orElseThrow(() -> new TeamRoleNotFoundException("Team role does not exist: " + role)))
                .toList();
    }
}