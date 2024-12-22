package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.database.entity.Team;
import org.league.app.database.entity.TeamMember;
import org.league.app.database.entity.enums.TeamRole;
import org.league.app.database.entity.enums.TeamStatus;
import org.league.app.database.repository.TeamMemberRepository;
import org.league.app.database.repository.TeamRepository;
import org.league.app.dto.TeamCreateEditDto;
import org.league.app.dto.TeamReadDto;
import org.league.app.exception.TeamAlreadyExistsException;
import org.league.app.feign.AuthClientFeign;
import org.league.app.feign.UserDto;
import org.league.app.mapper.TeamMapper;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeamService {

    private final TeamMemberRepository teamMemberRepository;
    private final TeamRepository teamRepository;
    private final TeamMapper teamMapper;
    private final AuthClientFeign authClientFeign;

    @Transactional
    public TeamReadDto createTeam(TeamCreateEditDto teamCreateDto) {
        UserDto userByEmail = authClientFeign.getUserByEmail(securityContext());

        Optional<Team> existingTeam = teamRepository.findTeamByTeamName(teamCreateDto.getTeamName());
        if (existingTeam.isPresent()) {
            throw new TeamAlreadyExistsException("Team name already exists");
        }

        Team team = Optional.of(teamCreateDto)
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

    private String securityContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UserDto) {
            UserDto userDto = (UserDto) authentication.getPrincipal();
            return userDto.getEmail();
        }
        return authentication.getName();
    }

}