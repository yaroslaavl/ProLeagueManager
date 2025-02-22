package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.broker.TournamentBracketDto;
import org.league.app.broker.TournamentEventPublisher;
import org.league.app.database.entity.Competition;
import org.league.app.database.entity.CompetitionParticipant;
import org.league.app.database.entity.TournamentStage;
import org.league.app.database.entity.enums.CompetitionStatus;
import org.league.app.database.repository.CompetitionParticipantRepository;
import org.league.app.database.repository.CompetitionRepository;
import org.league.app.database.repository.TournamentStageRepository;
import org.league.app.dto.CompetitionParticipantReadDto;
import org.league.app.dto.CompetitionReadDto;
import org.league.app.dto.TournamentStageReadDto;
import org.league.app.exception.CompetitionNotFoundException;
import org.league.app.exception.IncorrectTournamentStatus;
import org.league.app.feign.sportClient.SportClientFeign;
import org.league.app.feign.sportClient.SportDto;
import org.league.app.mapper.CompetitionMapper;
import org.league.app.mapper.CompetitionParticipantMapper;
import org.league.app.mapper.TournamentStageMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TournamentStageService {

    private final SportClientFeign sportClient;
    private final TournamentEventPublisher tournamentEventPublisher;
    private final CompetitionRepository competitionRepository;
    private final TournamentStageRepository tournamentStageRepository;
    private final CompetitionParticipantRepository competitionParticipantRepository;
    private final CompetitionMapper competitionMapper;
    private final TournamentStageMapper tournamentStageMapper;
    private final CompetitionParticipantMapper competitionParticipantMapper;

    @Transactional
    public void closeTournamentRegistrationAndGenerateTournamentStages(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        if (checkTournamentCapacity(competitionId)) {
            competition.setStatus(CompetitionStatus.CANCELLED);
        } else {
            competition.setStatus(CompetitionStatus.ACTIVE);
        }

        competitionRepository.saveAndFlush(competition);

        if (competition.getStatus().equals(CompetitionStatus.ACTIVE)) {
            generateTournamentStages(competitionId);

            List<TournamentStage> tournamentStagesByCompetition = tournamentStageRepository.findTournamentStagesByCompetitionId(competitionId);
            List<CompetitionParticipant> competitionParticipantList = competitionParticipantRepository.findAllByCompetitionId(competitionId);

            CompetitionReadDto competitionReadDto = competitionMapper.toDto(competition);

            List<TournamentStageReadDto>  tournamentStageReadDtoList = tournamentStagesByCompetition.stream()
                    .map(tournamentStageMapper::toDto)
                    .toList();

            List<CompetitionParticipantReadDto> competitionParticipantReadDtoList = competitionParticipantList.stream()
                            .map(competitionParticipantMapper::toDto)
                            .toList();

            SportDto sportById = sportClient.findSportById(competition.getSportId());

            tournamentEventPublisher.publishTournamentStartEvent(new TournamentBracketDto(
                    competitionReadDto,
                    tournamentStageReadDtoList,
                    sportById,
                    competitionParticipantReadDtoList));
        }
    }

    private void generateTournamentStages(UUID competitionId) {
        Competition competition = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        if (!competition.getStatus().equals(CompetitionStatus.ACTIVE)) {
            throw new IncorrectTournamentStatus("Competition is not active");
        }

        if (!tournamentStageRepository.findTournamentStagesByCompetitionId(competitionId).isEmpty()) {
            log.error("Tournament stages already exist in competition '{}'", competition.getName());
            return;
        }

        Integer maxTeamSize = competition.getGameSystem().getMaxTeamSize();
        int counter = 1;
        for (int i = maxTeamSize / 2; i >= 1; i = i / 2) {
            String tempStage = "";
            if (i == 1) {
                tempStage = "FINAL";
            } else if (i == 2) {
                tempStage = "SEMI FINAL";
            } else {
                tempStage = "1/" + i;
            }

            String rules = competition.getGameSystem().getRules();
            boolean isElimination = rules.startsWith("Single Elimination");
            TournamentStage tournamentStage = TournamentStage.builder()
                    .competition(competition)
                    .stageName(tempStage)
                    .stageOrder(counter)
                    .isElimination(isElimination)
                    .build();

            tournamentStageRepository.saveAndFlush(tournamentStage);
            counter++;
        }
    }

    private boolean checkTournamentCapacity(UUID competitionId) {
        Competition competitionWithGameSystem = competitionRepository.findById(competitionId)
                .orElseThrow(() -> new CompetitionNotFoundException("Competition not found"));

        return competitionWithGameSystem.getGameSystem().getMinTeamSize() >
                competitionParticipantRepository.countTeamsOrUsersByCompetitionId(competitionId)
                 && LocalDateTime.now().isAfter(competitionWithGameSystem.getStartDate().minusHours(1));
    }
}
