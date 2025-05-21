/*
  # Ajout de la colonne description à la table articles

  1. Modifications
    - Ajout d'une colonne `description` de type text à la table `articles`
*/

-- Ajout de la colonne description à la table articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS description text;