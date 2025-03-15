CREATE TABLE IF NOT EXISTS sport.sport (
                             id SERIAL PRIMARY KEY,
                             name VARCHAR(100) NOT NULL,
                             is_esport BOOLEAN DEFAULT false NOT NULL,
                             created_at TIMESTAMP DEFAULT NOW()
);