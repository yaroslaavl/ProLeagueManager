package org.league.app.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.league.app.broker.LeagueBracketDto;
import org.league.app.broker.LeagueStandingDto;
import org.league.app.broker.TournamentBracketDto;
import org.league.app.database.entity.Match;
import org.league.app.database.repository.MatchRepository;
import org.league.app.dto.MatchReadDto;
import org.league.app.exception.MatchNotFoundException;
import org.league.app.mapper.MatchMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MatchService {

    private final MatchRepository matchRepository;
    private final MatchMapper matchMapper;

    public MatchReadDto findMatchById(UUID id) {
        return matchRepository.findById(id)
                .map(matchMapper::toDto)
                .orElseThrow(() -> new MatchNotFoundException("Match not found"));
    }

    public void generateTournamentBracket(TournamentBracketDto dto) {
        log.info("Generating tournament bracket");
    }

    public void generateLeagueMatches(List<LeagueBracketDto> leagueBracketDtos) {

        if (leagueBracketDtos.size() % 2 != 0) {
            leagueBracketDtos.add(null);
        }

        int teamNums = leagueBracketDtos.size();
        int totalRounds = teamNums - 1;
        int halfSize = teamNums / 2;

        LocalDateTime startDate = leagueBracketDtos.get(0).getCompetition().getStartDate();
        LocalDateTime endDate   = leagueBracketDtos.get(0).getCompetition().getEndDate();
        long daysCount = ChronoUnit.DAYS.between(startDate.toLocalDate(), endDate.toLocalDate()) + 1;

        if (totalRounds > daysCount) {
            throw new IllegalStateException("Недостаточно дней, чтобы сыграть все туры!");
        }

        List<LeagueBracketDto> temp = new ArrayList<>(leagueBracketDtos);
        LeagueBracketDto firstTeam = temp.removeFirst();

        for (int round = 0; round < totalRounds; round++) {

            LocalDateTime matchDay = startDate.plusDays(round);

            LeagueBracketDto teamA = firstTeam;
            LeagueBracketDto teamB = temp.get(temp.size() - 1);

            createAndSaveMatch(teamA, teamB, matchDay);

            for (int i = 0; i < halfSize - 1; i++) {
                LeagueBracketDto d1 = temp.get(i);
                LeagueBracketDto d2 = temp.get(temp.size() - 2 - i);
                createAndSaveMatch(d1, d2, matchDay);
            }

            LeagueBracketDto last = temp.remove(temp.size() - 1);
            temp.add(0, last);
        }
    }

    private void createAndSaveMatch(LeagueBracketDto dtoA, LeagueBracketDto dtoB, LocalDateTime matchDate) {
        if (dtoA == null || dtoB == null) {
            return;
        }

        UUID competitionId = dtoA.getLeagueStanding().getCompetitionId();
        if (dtoA.getLeagueStanding().getTeamId() == null) {
            Match match = Match.builder()
                    .competitionId(competitionId)
                    .playerAId(dtoA.getLeagueStanding().getPlayerId())
                    .playerBId(dtoB.getLeagueStanding().getPlayerId())
                    .matchDate(matchDate)
                    .build();

            matchRepository.save(match);
        } else {
            Match match = Match.builder()
                    .competitionId(competitionId)
                    .teamAId(dtoA.getLeagueStanding().getTeamId())
                    .teamBId(dtoB.getLeagueStanding().getTeamId())
                    .matchDate(matchDate)
                    .build();

            matchRepository.save(match);
        }
    }

}
