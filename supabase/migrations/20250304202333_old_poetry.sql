/*
  # Mise à jour des politiques de sécurité

  1. Modifications
    - Mise à jour des politiques pour les articles
    - Mise à jour des politiques pour les catégories
    - Mise à jour des politiques pour les fournisseurs
    - Mise à jour des politiques pour les agences

  2. Changements
    - Les utilisateurs authentifiés peuvent maintenant :
      - Lire tous les articles
      - Créer des articles
      - Modifier tous les articles
      - Supprimer tous les articles
      - Gérer les catégories, fournisseurs et agences
*/

-- Supprimer les anciennes politiques pour les articles
DROP POLICY IF EXISTS "Anyone can read articles" ON articles;
DROP POLICY IF EXISTS "Users can insert their own articles" ON articles;
DROP POLICY IF EXISTS "Users can update their own articles" ON articles;
DROP POLICY IF EXISTS "Users can delete their own articles" ON articles;

-- Créer les nouvelles politiques pour les articles
CREATE POLICY "Authenticated users can read articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (true);

-- Supprimer les anciennes politiques pour les catégories
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
DROP POLICY IF EXISTS "Anyone can insert categories" ON categories;

-- Créer les nouvelles politiques pour les catégories
CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Supprimer les anciennes politiques pour les fournisseurs
DROP POLICY IF EXISTS "Anyone can read suppliers" ON suppliers;
DROP POLICY IF EXISTS "Anyone can insert suppliers" ON suppliers;

-- Créer les nouvelles politiques pour les fournisseurs
CREATE POLICY "Authenticated users can manage suppliers"
  ON suppliers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Supprimer les anciennes politiques pour les agences
DROP POLICY IF EXISTS "Anyone can read agencies" ON agencies;
DROP POLICY IF EXISTS "Anyone can insert agencies" ON agencies;

-- Créer les nouvelles politiques pour les agences
CREATE POLICY "Authenticated users can manage agencies"
  ON agencies
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);