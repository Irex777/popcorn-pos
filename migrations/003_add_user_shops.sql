CREATE TABLE IF NOT EXISTS user_shops (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shop_id INTEGER NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, shop_id)
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_user_shops_user_id ON user_shops(user_id);
CREATE INDEX IF NOT EXISTS idx_user_shops_shop_id ON user_shops(shop_id);

-- Migrate existing data: assign all shops to existing non-admin users
INSERT INTO user_shops (user_id, shop_id)
SELECT u.id as user_id, s.id as shop_id
FROM users u
CROSS JOIN shops s
WHERE NOT u.is_admin
ON CONFLICT DO NOTHING;
