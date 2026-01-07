-- Migration Admin Schema pour Inpicker
-- Création de la table users pour gestion dynamique

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    pin TEXT NOT NULL,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    last_login_at TEXT
);

-- Migration des utilisateurs existants depuis le hardcode
INSERT OR IGNORE INTO users (id, name, pin, is_admin) VALUES
    ('yaelle', 'Yaëlle', '141116', 0),
    ('renaud', 'Renaud', '246809', 1);
