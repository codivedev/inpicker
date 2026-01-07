-- Migration initiale pour Inpicker D1
-- Création des tables pour l'Art Assistant

CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY, -- brand|number
    brand TEXT NOT NULL,
    number TEXT NOT NULL,
    is_owned BOOLEAN DEFAULT 0,
    user_id TEXT NOT NULL -- Pour future multi-user via Auth
);

CREATE TABLE IF NOT EXISTS custom_pencils (
    id TEXT PRIMARY KEY,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    hex TEXT NOT NULL,
    r INTEGER NOT NULL,
    g INTEGER NOT NULL,
    b INTEGER NOT NULL,
    user_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drawings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    image_r2_key TEXT, -- Référence à R2
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    user_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS drawing_pencils (
    drawing_id INTEGER,
    pencil_id TEXT,
    PRIMARY KEY (drawing_id, pencil_id),
    FOREIGN KEY (drawing_id) REFERENCES drawings(id) ON DELETE CASCADE
);
