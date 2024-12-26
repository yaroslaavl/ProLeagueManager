package org.league.app.service;

import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.dto.*;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.enums.TeamRole;
import org.league.app.database.entity.enums.TeamStatus;
import org.league.app.database.repository.TeamMemberRepository;
import org.league.app.database.repository.TeamRepository;
import org.league.app.exception.NotManagerException;
import org.league.app.exception.TeamAlreadyExistsException;
import org.league.app.feign.AuthClientFeign;
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
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TeamService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final TeamMapper teamMapper;
    private final AuthClientFeign authClientFeign;

    @Value("${app.image.uploadDir}")
    private String uploadDir;

    @Transactional
    public TeamReadDto createTeam(TeamCreateEditDto teamCreateEditDto) {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        Team existingTeam = teamRepository.findTeamByTeamName(teamCreateEditDto.getTeamName());

        if(existingTeam != null) {
            throw new TeamAlreadyExistsException("Team name already exists");
        }

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
                .teamRole(TeamRole.MANAGER)
                .isSubstitute(false)
                .build();

        teamMemberRepository.save(teamMember);
        return teamMapper.toDto(team);
    }

    @Transactional
    public TeamReadDto updateTeamName(TeamCreateEditDto teamCreateEditDto) {
        Team team = getTeam();

        if(team == null) {
            throw new TeamAlreadyExistsException("Team name already exists");
        }

        Team teamToUpdate = teamRepository.findTeamById(team.getId())
                .orElseThrow(() -> new TeamAlreadyExistsException("Team does not exist"));

        teamToUpdate.setTeamName(teamCreateEditDto.getTeamName());

        teamRepository.save(teamToUpdate);
        return teamMapper.toDto(teamToUpdate);
    }

    public TeamMemberDto getTeamByName(String teamName) {
        Team team = teamRepository.findTeamByTeamName(teamName);

        if(team == null) {
            throw new TeamAlreadyExistsException("Team name does not exist");
        }

        List<TeamMemberCreateDto> members = teamMemberRepository
                .findTeamMemberByTeamId(team.getId()).stream()
                .map(member -> {
                    TeamMemberCreateDto dto = new TeamMemberCreateDto();
                    dto.setTeamId(team.getId());
                    dto.setUserId(member.getUserId());
                    dto.setTeamRole(member.getTeamRole());
                    dto.setIsSubstitute(member.getIsSubstitute());
                    dto.setJoinedAt(member.getJoinedAt());
                    return dto;
                })
                .toList();

        TeamReadDto teamReadDto = teamMapper.toDto(team);
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

        TeamRole teamRole = teamMember.map(TeamMember::getTeamRole).orElse(null);
        return new UserTeamStatusDto(isMember, teamRole);
    }

    @Transactional
    public String uploadTeamLogo(UploadTeamLogoDto uploadTeamLogoDto) throws IOException {
        Team team = getTeam();

        log.info("Team found by team name: {}", team);
        MultipartFile file = uploadTeamLogoDto.getTeamLogo();

        if (file != null && !file.isEmpty()) {
            String extension = Objects.requireNonNull(file.getOriginalFilename()).substring(file.getOriginalFilename().lastIndexOf("."));
            String filename = team.getId() + "_team-logo" + extension;

            String oldFileName = team.getTeamImage();
            if (oldFileName != null && !oldFileName.isEmpty()) {
                Path path = Paths.get(uploadDir, oldFileName);
                if (Files.exists(path)) {
                    Files.delete(path);
                }
            }
            Path path = Paths.get(uploadDir, filename);

            if (Files.exists(path)) {
                Files.delete(path);
            }

            File directory = new File(uploadDir);
            if (!directory.exists()) {
                directory.mkdirs();
            }
            Files.write(path, file.getBytes());

            team.setTeamImage(filename);
            teamRepository.save(team);

            return filename;
        }

        return null;
    }

    public byte[] getTeamImage(String teamName) {
        Team team = teamRepository.findTeamByTeamName(teamName);

        if (team.getTeamImage() != null) {
            Path path = Paths.get(uploadDir, team.getTeamImage());
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

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto userDto) {
            return userDto.getEmail();
        }
        return authentication.getName();
    }

    private Team getTeam() {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        Optional<TeamMember> teamByUserId = teamMemberRepository.findTeamByUserId(userByEmail.getId());

        boolean isManager = teamMemberRepository.findByTeamIdAndUserId(teamByUserId.get().getTeam().getId(), userByEmail.getId())
                .map(teamMember -> teamMember.getTeamRole() == TeamRole.MANAGER)
                .orElse(false);

        if (!isManager) {
            throw new NotManagerException("Access denied: You are not a manager of this team.");
        }

        return teamRepository.findTeamByTeamName(teamByUserId.get().getTeam().getTeamName());
    }
}