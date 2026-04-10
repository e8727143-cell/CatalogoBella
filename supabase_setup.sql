-- Create products table
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  promo TEXT NOT NULL,
  image TEXT NOT NULL,
  colors TEXT[] NOT NULL,
  sizes TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read products
CREATE POLICY "Allow public read access" ON products
  FOR SELECT USING (true);

-- Insert initial data
INSERT INTO products (name, category, promo, image, colors, sizes) VALUES
('Sneaker Urban White', 'Femenino', 'promo-2600', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=800', ARRAY['Blanco', 'Beige', 'Rosa'], ARRAY['36', '37', '38', '39', '40']),
('Sport Runner Black', 'Masculino', 'promo-2990', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=800', ARRAY['Negro', 'Gris Oscuro', 'Blanco'], ARRAY['40', '41', '42', '43', '44', '45']),
('Kids Play Pink', 'Infantil', 'promo-2600', 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&q=80&w=800', ARRAY['Rosa', 'Blanco', 'Beige'], ARRAY['28', '29', '30', '31', '32', '33', '34', '35']),
('Classic Leather Brown', 'Masculino', 'promo-2990', 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&q=80&w=800', ARRAY['Beige Oscuro', 'Negro', 'Blanco'], ARRAY['40', '41', '42', '43', '44', '45']),
('Vibrant Sky Blue', 'Femenino', 'promo-2600', 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&q=80&w=800', ARRAY['Rosa Pastel', 'Blanco', 'Beige'], ARRAY['36', '37', '38', '39', '40']),
('Junior Speed', 'Infantil', 'promo-2990', 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&q=80&w=800', ARRAY['Negro', 'Blanco', 'Rosa'], ARRAY['28', '29', '30', '31', '32', '33', '34', '35']);
