CREATE TABLE "calendar_event".event
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    match_id    UUID REFERENCES match.match (id) ON DELETE CASCADE,
    competition_id    UUID REFERENCES competition_management.competition (id) ON DELETE CASCADE,
    event_type  VARCHAR(32),
    status      VARCHAR(50),
    event_image varchar(255),
    is_pinned    BOOLEAN DEFAULT FALSE,
    category    varchar(32),

    created_at  TIMESTAMP   DEFAULT NOW(),
    updated_at  TIMESTAMP     DEFAULT NOW()
);