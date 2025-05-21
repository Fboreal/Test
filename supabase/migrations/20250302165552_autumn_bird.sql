/*
  # Ajout des champs de prix aux articles

  1. Modifications
    - Ajout du champ `unit_price` (prix unitaire) à la table `articles`
    - Ajout du champ `total_price` (prix total) à la table `articles`
  
  2. Description
    - Ces champs permettent de suivre les informations financières des articles
    - Le prix unitaire est saisi par l'utilisateur
    - Le prix total est calculé automatiquement (quantité × prix unitaire)
*/

-- Ajout des colonnes de prix à la table articles
ALTER TABLE articles ADD COLUMN IF NOT EXISTS unit_price numeric;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS total_price numeric;