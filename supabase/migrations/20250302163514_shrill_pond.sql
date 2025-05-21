/*
  # Initial schema for Etandstock application

  1. New Tables
    - `articles` - Main table for storing article information
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `name` (text)
      - `category` (text)
      - `supplier` (text)
      - `agency` (text)
      - `quantity` (numeric)
      - `unit` (text)
      - `expiry_date` (timestamptz, nullable)
      - `image_url` (text, nullable)
      - `user_id` (uuid, references auth.users)
    
    - `categories` - Table for storing article categories
      - `id` (uuid, primary key)
      - `name` (text, unique)
    
    - `suppliers` - Table for storing suppliers
      - `id` (uuid, primary key)
      - `name` (text, unique)
    
    - `agencies` - Table for storing agencies
      - `id` (uuid, primary key)
      - `name` (text, unique)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to insert their own data
    - Add policies for authenticated users to update their own data
    - Add policies for authenticated users to delete their own data
*/

-- Create articles table
CREATE TABLE IF NOT EXISTS articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  name text NOT NULL,
  category text NOT NULL,
  supplier text NOT NULL,
  agency text NOT NULL,
  quantity numeric NOT NULL,
  unit text NOT NULL,
  expiry_date timestamptz,
  image_url text,
  user_id uuid REFERENCES auth.users(id) NOT NULL
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

-- Enable Row Level Security
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Create policies for articles table
CREATE POLICY "Anyone can read articles"
  ON articles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own articles"
  ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own articles"
  ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own articles"
  ON articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for categories table
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for suppliers table
CREATE POLICY "Anyone can read suppliers"
  ON suppliers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert suppliers"
  ON suppliers
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for agencies table
CREATE POLICY "Anyone can read agencies"
  ON agencies
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert agencies"
  ON agencies
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert some initial data
INSERT INTO categories (name) VALUES 
  ('Matériaux de construction'),
  ('Outillage'),
  ('Électricité'),
  ('Plomberie'),
  ('Peinture'),
  ('Quincaillerie')
ON CONFLICT (name) DO NOTHING;

INSERT INTO suppliers (name) VALUES 
  ('Fournisseur A'),
  ('Fournisseur B'),
  ('Fournisseur C'),
  ('Fournisseur D')
ON CONFLICT (name) DO NOTHING;

INSERT INTO agencies (name) VALUES 
  ('Agence Paris'),
  ('Agence Lyon'),
  ('Agence Marseille'),
  ('Agence Bordeaux')
ON CONFLICT (name) DO NOTHING;

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Anyone can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

-- Allow public access to images
CREATE POLICY "Anyone can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');