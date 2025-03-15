CREATE TABLE IF NOT EXISTS user_data.role_group(
                                     id SERIAL PRIMARY KEY,
                                     name VARCHAR(255) NOT NULL UNIQUE,
                                     description TEXT,
                                     created_at TIMESTAMP DEFAULT NOW(),
                                     updated_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_data.role (
                                id SERIAL PRIMARY KEY,
                                name VARCHAR(255) NOT NULL UNIQUE,
                                description TEXT,
                                created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS user_data.group_role (
                                      group_id INTEGER NOT NULL REFERENCES user_data.role_group(id) ON DELETE CASCADE,
                                      role_id INTEGER NOT NULL REFERENCES user_data.role(id) ON DELETE CASCADE,
                                      PRIMARY KEY (group_id, role_id)
);
CREATE TABLE IF NOT EXISTS user_data."user" (
                                  id BIGSERIAL PRIMARY KEY,
                                  username VARCHAR(255) NOT NULL UNIQUE,
                                  email VARCHAR(255) NOT NULL UNIQUE,
                                  password_hash VARCHAR(255) NOT NULL,
                                  first_name VARCHAR(255) NOT NULL,
                                  last_name VARCHAR(255) NOT NULL,
                                  birth_date DATE,
                                  role_group_id INTEGER REFERENCES user_data.role_group(id) ON DELETE SET NULL,
                                  is_verified BOOLEAN DEFAULT false,
                                  email_verification_token VARCHAR(255),
                                  user_image varchar(255),
                                  created_at TIMESTAMP DEFAULT NOW(),
                                  updated_at TIMESTAMP DEFAULT NOW()
);