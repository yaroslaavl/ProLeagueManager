INSERT INTO team_management.team_role (name, description, created_at)
VALUES
    ('MANAGER', '', NOW()),
    ('CAPTAIN', '', NOW()),
    ('PLAYER', '', NOW())
ON CONFLICT (name) DO NOTHING;