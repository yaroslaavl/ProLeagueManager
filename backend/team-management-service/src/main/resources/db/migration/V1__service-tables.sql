CREATE TABLE IF NOT EXISTS team_management.team (
                                      id UUID PRIMARY KEY,
                                      team_name VARCHAR(50) NOT NULL UNIQUE,
                                      team_status VARCHAR(32),
                                      team_image varchar(255),
                                      created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS team_management.team_member (
                                             id BIGSERIAL PRIMARY KEY,
                                             team_id UUID REFERENCES team_management.team(id) ON DELETE CASCADE,
                                             user_id BIGINT REFERENCES user_data."user"(id) ON DELETE CASCADE,
                                             is_substitute BOOLEAN DEFAULT FALSE,
                                             joined_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_management.team_role (
                                           id SERIAL PRIMARY KEY,
                                           name VARCHAR(255) NOT NULL UNIQUE,
                                           description TEXT,
                                           created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_management.team_member_role (
                                                  team_member_id BIGINT NOT NULL REFERENCES team_management.team_member(id) ON DELETE CASCADE,
                                                  team_role_id INTEGER NOT NULL REFERENCES team_management.team_role(id) ON DELETE CASCADE,
                                                  PRIMARY KEY (team_member_id, team_role_id)
);