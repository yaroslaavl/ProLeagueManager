CREATE TABLE IF NOT EXISTS match.match (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             competition_id UUID REFERENCES competition_management.competition(id) ON DELETE CASCADE,
                             stage_id UUID REFERENCES competition_management.tournament_stage(id) ON DELETE SET NULL,
                             team_a_id UUID REFERENCES team_management.team(id) ON DELETE SET NULL,
                             team_b_id UUID REFERENCES team_management.team(id) ON DELETE SET NULL,
                             player_a_id BIGINT REFERENCES user_data."user"(id) ON DELETE SET NULL,
                             player_b_id BIGINT REFERENCES user_data."user"(id) ON DELETE SET NULL,
                             match_date TIMESTAMP,
                             status VARCHAR(50),
                             score_a INTEGER DEFAULT 0,
                             score_b INTEGER DEFAULT 0,
                             is_overtime BOOLEAN DEFAULT FALSE,
                             is_draw BOOLEAN DEFAULT FALSE,
                             winner_team_id UUID REFERENCES team_management.team(id),
                             winner_player_id BIGINT REFERENCES user_data."user"(id) ON DELETE SET NULL,
                             league_tour_number INTEGER,
                             a_confirmed BOOLEAN DEFAULT FALSE,
                             b_confirmed BOOLEAN DEFAULT FALSE,
                             created_at TIMESTAMP DEFAULT NOW(),
                             updated_at TIMESTAMP DEFAULT NOW(),
                             next_match_id UUID REFERENCES match.match(id) ON DELETE SET NULL
);
CREATE TABLE IF NOT EXISTS match.match_player (
                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                    match_id UUID REFERENCES match.match(id) ON DELETE CASCADE,
                                    player_id BIGINT REFERENCES user_data."user"(id) ON DELETE CASCADE,
                                    team_id UUID REFERENCES team_management.team(id) ON DELETE CASCADE,
                                    is_starting BOOLEAN DEFAULT FALSE,
                                    created_at TIMESTAMP DEFAULT NOW(),
                                    updated_at TIMESTAMP DEFAULT NOW()
);