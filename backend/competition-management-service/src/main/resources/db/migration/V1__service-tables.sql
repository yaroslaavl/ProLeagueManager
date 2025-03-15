CREATE TABLE IF NOT EXISTS competition_management.game_system (
                                                    id SERIAL PRIMARY KEY,
                                                    sport_id INTEGER REFERENCES sport.sport(id) ON DELETE CASCADE,
                                                    name VARCHAR(100) NOT NULL,
                                                    rules TEXT,
                                                    min_team INTEGER,
                                                    max_team INTEGER,
                                                    players_per_team INTEGER,
                                                    allow_subs BOOLEAN,
                                                    max_subs INTEGER,
                                                    is_individual BOOLEAN,
                                                    min_age int,
                                                    max_age int,
                                                    created_at TIMESTAMP DEFAULT NOW(),
                                                    updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS competition_management.competition (
                                                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                    name VARCHAR(50) NOT NULL,
                                                    sport_id INTEGER REFERENCES sport.sport(id) ON DELETE CASCADE,
                                                    game_system_id INTEGER REFERENCES competition_management.game_system(id) ON DELETE CASCADE,
                                                    competition_type VARCHAR(32),
                                                    start_date TIMESTAMP,
                                                    end_date TIMESTAMP,
                                                    created_at TIMESTAMP DEFAULT NOW(),
                                                    updated_at TIMESTAMP DEFAULT NOW(),
                                                    image varchar(255),
                                                    competition_status VARCHAR(20) NOT NULL DEFAULT 'UPCOMING'
);
CREATE TABLE IF NOT EXISTS competition_management.tournament_stage (
                                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                         competition_id UUID REFERENCES competition_management.competition(id) ON DELETE CASCADE,
                                                         stage_name VARCHAR(50) NOT NULL,
                                                         stage_order INTEGER NOT NULL,
                                                         is_elimination BOOLEAN,
                                                         created_at TIMESTAMP DEFAULT NOW(),
                                                         updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS competition_management.competition_participant (
                                                                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                                competition_id UUID REFERENCES competition_management.competition(id) ON DELETE CASCADE,
                                                                team_id UUID REFERENCES team_management.team(id) ON DELETE CASCADE,
                                                                player_id BIGINT REFERENCES user_data."user"(id) ON DELETE SET NULL,
                                                                is_team BOOLEAN DEFAULT TRUE,
                                                                registered_at TIMESTAMPTZ DEFAULT NOW(),
                                                                status VARCHAR(32),
                                                                created_at TIMESTAMPTZ DEFAULT NOW(),
                                                                updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS competition_management.league_standings (
                                                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                                         competition_id UUID REFERENCES competition_management.competition(id) ON DELETE CASCADE,
                                                         team_id UUID REFERENCES team_management.team(id) ON DELETE CASCADE,
                                                         player_id BIGINT REFERENCES user_data."user"(id) ON DELETE CASCADE,
                                                         wins INTEGER DEFAULT 0,
                                                         draws INTEGER DEFAULT 0,
                                                         losses INTEGER DEFAULT 0,
                                                         points INTEGER DEFAULT 0,
                                                         created_at TIMESTAMP DEFAULT NOW(),
                                                         updated_at TIMESTAMP DEFAULT NOW()
);