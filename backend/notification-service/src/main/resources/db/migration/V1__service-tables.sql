CREATE TABLE IF NOT EXISTS notification.notification (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                           user_id BIGINT REFERENCES user_data."user"(id) ON DELETE CASCADE,
                                           target_user_id BIGINT REFERENCES user_data."user"(id) ON DELETE CASCADE,
                                           team_id UUID REFERENCES team_management.team(id) ON DELETE CASCADE,
                                           message TEXT NOT NULL,
                                           event_type VARCHAR(50),
                                           is_read BOOLEAN DEFAULT FALSE,
                                           created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS notification.user_notification_subscription (
                                                             id BIGSERIAL PRIMARY KEY,
                                                             user_id BIGINT REFERENCES user_data."user"(id) ON DELETE CASCADE,
                                                             event_category VARCHAR(50),
                                                             is_active BOOLEAN DEFAULT TRUE,
                                                             created_at TIMESTAMP DEFAULT NOW(),
                                                             updated_at TIMESTAMP DEFAULT NOW()
);