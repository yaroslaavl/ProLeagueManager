INSERT INTO user_data.role (name, description, created_at)
VALUES
    ('ADMIN', '', NOW()),
    ('MODERATOR', '', NOW()),
    ('AUTHORISED_USER', '', NOW()),
    ('USER', '', NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_data.role_group (name, description, created_at, updated_at)
VALUES
    ('SYSTEM_ADMIN', '', NOW(), NOW()),
    ('CONTENT_TEAM', '', NOW(), NOW()),
    ('VERIFIED_USER', '', NOW(), NOW()),
    ('USER', '', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;

INSERT INTO user_data.group_role (group_id, role_id)
VALUES
    (1, 1),
    (1, 2),
    (1, 3),
    (1, 4),
    (2, 2),
    (2, 3),
    (2, 4),
    (3, 3),
    (3, 4),
    (4, 4)
ON CONFLICT DO NOTHING;

INSERT INTO user_data."user" (id, username, email, password_hash, first_name, last_name, birth_date, role_group_id,
                              is_verified, email_verification_token, user_image, created_at, updated_at)
VALUES (4, 'Tester', 'test@gmail.com', '$2a$10$rM/7HDDEzT9QremoEe3Hh..3eMYHBf.ZKSwP7oD0W2Xsf805E6AaW', 'Testerchi',
        'Testerov', '2000-01-01', 1, true, '', NULL, '2025-01-28 23:05:45.664717', '2025-01-28 23:05:45.664717')
ON CONFLICT (id) DO NOTHING;