CREATE TABLE IF NOT EXISTS feedback.feedback
(
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        BIGINT REFERENCES user_data."user" (id) ON DELETE CASCADE,
    competition_id UUID REFERENCES competition_management.competition (id) ON DELETE CASCADE,
    message        TEXT,
    tonality VARCHAR(15),
    lang VARCHAR(20),
    likes          INTEGER          DEFAULT 0,
    created_at     TIMESTAMP        DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback.review_likes
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id UUID REFERENCES feedback."feedback" (id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES user_data."user" (id) ON DELETE CASCADE
);