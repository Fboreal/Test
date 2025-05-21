/*
  # Amélioration des politiques de sécurité pour le stockage

  1. Politiques de stockage
    - Permettre aux utilisateurs authentifiés de gérer leurs images
    - Permettre l'accès public aux images
*/

-- Supprimer les anciennes politiques de stockage
DROP POLICY IF EXISTS "Anyone can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view images" ON storage.objects;

-- Créer les nouvelles politiques de stockage
CREATE POLICY "Authenticated users can manage their images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');