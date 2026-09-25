CREATE TABLE IF NOT EXISTS users (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'agent') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS messages (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  content TEXT NOT NULL,
  message_uuid CHAR(36) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  KEY idx_messages_users (sender_id, receiver_id),
  KEY idx_messages_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users (name, email, password_hash, role)
VALUES
  ('Cliente Demo', 'customer@demo.com', '$2a$10$Qa7Sc56IR0R9X5RHFlaP9eA3vsQMRxO09EPNR6yKh5KJPKBCqmPlS', 'customer'),
  ('Agente Demo', 'agent@demo.com', '$2a$10$CGthuiqr10goZfMlV4x0Y./xwCoV3/lGD3i3u1bRtWOdyzAJLrZH6', 'agent')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password_hash = VALUES(password_hash),
  role = VALUES(role);

INSERT INTO messages (sender_id, receiver_id, content, message_uuid)
SELECT u1.id, u2.id, 'Hola, necesito ayuda con mi pedido.', '11111111-1111-4111-8111-111111111111'
FROM users u1, users u2
WHERE u1.email = 'customer@demo.com' AND u2.email = 'agent@demo.com'
ON DUPLICATE KEY UPDATE
  content = VALUES(content);

INSERT INTO messages (sender_id, receiver_id, content, message_uuid)
SELECT u2.id, u1.id, 'Claro, te ayudo enseguida.', '22222222-2222-4222-8222-222222222222'
FROM users u1, users u2
WHERE u1.email = 'customer@demo.com' AND u2.email = 'agent@demo.com'
ON DUPLICATE KEY UPDATE
  content = VALUES(content);
