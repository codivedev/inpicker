-- Migration 0005: Fix multi-user primary keys
-- SQLite doesn't support ALTER TABLE to change PK, so we recreate the tables.

-- 1. inventory table
CREATE TABLE IF NOT EXISTS inventory_new (
    id TEXT NOT NULL,
    brand TEXT NOT NULL,
    number TEXT NOT NULL,
    is_owned BOOLEAN DEFAULT 0,
    is_hidden BOOLEAN DEFAULT 0,
    user_id TEXT NOT NULL,
    PRIMARY KEY (id, user_id)
);

INSERT INTO inventory_new (id, brand, number, is_owned, is_hidden, user_id)
SELECT id, brand, number, is_owned, COALESCE(is_hidden, 0), user_id FROM inventory;

DROP TABLE inventory;
ALTER TABLE inventory_new RENAME TO inventory;

-- 2. custom_pencils table
CREATE TABLE IF NOT EXISTS custom_pencils_new (
    id TEXT NOT NULL,
    brand TEXT NOT NULL,
    name TEXT NOT NULL,
    number TEXT NOT NULL,
    hex TEXT NOT NULL,
    r INTEGER NOT NULL,
    g INTEGER NOT NULL,
    b INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (id, user_id)
);

INSERT INTO custom_pencils_new (id, brand, name, number, hex, r, g, b, user_id)
SELECT id, brand, name, number, hex, r, g, b, user_id FROM custom_pencils;

DROP TABLE custom_pencils;
ALTER TABLE custom_pencils_new RENAME TO custom_pencils;

-- 3. brands table
CREATE TABLE IF NOT EXISTS brands_new (
    id TEXT NOT NULL,
    name TEXT NOT NULL,
    user_id TEXT NOT NULL,
    PRIMARY KEY (id, user_id)
);

INSERT INTO brands_new (id, name, user_id)
SELECT id, name, user_id FROM brands;

DROP TABLE brands;
ALTER TABLE brands_new RENAME TO brands;
