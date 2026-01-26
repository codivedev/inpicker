-- Ajout de la colonne is_hidden pour permettre de "supprimer" n'importe quel crayon (même les statiques)
ALTER TABLE inventory ADD COLUMN is_hidden BOOLEAN DEFAULT 0;
