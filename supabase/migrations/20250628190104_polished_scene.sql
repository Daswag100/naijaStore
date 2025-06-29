/*
  # Create NaijaStore Database Schema

  1. New Tables
    - `users` - User accounts with authentication
    - `categories` - Product categories
    - `products` - Product catalog
    - `cart_items` - Shopping cart items
    - `orders` - Customer orders
    - `order_items` - Individual items in orders
    - `user_addresses` - User shipping addresses

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure data access based on user ownership

  3. Sample Data
    - Nigerian product categories
    - Sample products with Nigerian pricing
    - Test user data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  phone text,
  email_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  description text NOT NULL,
  price numeric(10,2) NOT NULL,
  compare_price numeric(10,2),
  sku text UNIQUE NOT NULL,
  inventory_quantity integer DEFAULT 0,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  images text[] DEFAULT '{}',
  status text DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cart items table
CREATE TABLE IF NOT EXISTS cart_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount numeric(10,2) NOT NULL,
  shipping_cost numeric(10,2) DEFAULT 0,
  shipping_address jsonb NOT NULL,
  billing_address jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  product_name text NOT NULL
);

-- User addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  address_line1 text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  country text DEFAULT 'Nigeria',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Categories policies (public read)
CREATE POLICY "Categories are viewable by everyone" ON categories
  FOR SELECT USING (true);

-- Products policies (public read)
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (status = 'active');

-- Cart items policies
CREATE POLICY "Users can manage own cart items" ON cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order items policies
CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create order items for own orders" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- User addresses policies
CREATE POLICY "Users can manage own addresses" ON user_addresses
  FOR ALL USING (auth.uid() = user_id);

-- Insert sample categories
INSERT INTO categories (name, slug, description, image_url) VALUES
  ('Electronics', 'electronics', 'Latest smartphones, laptops, and gadgets', 'https://images.pexels.com/photos/356056/pexels-photo-356056.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Fashion', 'fashion', 'Trendy clothing, shoes, and accessories', 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Home & Garden', 'home-garden', 'Furniture, decor, and garden essentials', 'https://images.pexels.com/photos/1080721/pexels-photo-1080721.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Sports & Fitness', 'sports-fitness', 'Sports equipment and fitness gear', 'https://images.pexels.com/photos/416717/pexels-photo-416717.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Beauty & Health', 'beauty-health', 'Skincare, makeup, and health products', 'https://images.pexels.com/photos/3373736/pexels-photo-3373736.jpeg?auto=compress&cs=tinysrgb&w=800'),
  ('Automotive', 'automotive', 'Car accessories and automotive parts', 'https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=800')
ON CONFLICT (slug) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, slug, description, price, compare_price, sku, inventory_quantity, category_id, images, status) VALUES
  (
    'Samsung Galaxy S24 Ultra',
    'samsung-galaxy-s24-ultra',
    'Latest Samsung flagship with advanced camera and S Pen',
    850000,
    950000,
    'SAM-S24U-001',
    25,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    ARRAY['https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'Apple MacBook Air M2',
    'apple-macbook-air-m2',
    'Powerful and lightweight laptop with M2 chip',
    1200000,
    1350000,
    'APL-MBA-M2-001',
    15,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    ARRAY['https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'Nike Air Force 1',
    'nike-air-force-1',
    'Classic white sneakers for everyday wear',
    65000,
    80000,
    'NIK-AF1-WHT-001',
    50,
    (SELECT id FROM categories WHERE slug = 'fashion'),
    ARRAY['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'Sony WH-1000XM4 Headphones',
    'sony-wh-1000xm4',
    'Premium noise-cancelling wireless headphones',
    180000,
    220000,
    'SON-WH1000XM4-001',
    30,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    ARRAY['https://images.pexels.com/photos/3394650/pexels-photo-3394650.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'LG 55" OLED Smart TV',
    'lg-55-oled-smart-tv',
    'Ultra-thin OLED display with smart features',
    450000,
    520000,
    'LG-OLED55-001',
    12,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    ARRAY['https://images.pexels.com/photos/1201996/pexels-photo-1201996.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'Adidas Ultraboost 22',
    'adidas-ultraboost-22',
    'High-performance running shoes with boost technology',
    85000,
    100000,
    'ADI-UB22-001',
    0,
    (SELECT id FROM categories WHERE slug = 'fashion'),
    ARRAY['https://images.pexels.com/photos/1456706/pexels-photo-1456706.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'iPhone 15 Pro Max',
    'iphone-15-pro-max',
    'Latest iPhone with titanium design and advanced camera',
    950000,
    1100000,
    'APL-IP15PM-001',
    20,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    ARRAY['https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  ),
  (
    'Dell XPS 13 Laptop',
    'dell-xps-13',
    'Premium ultrabook with InfinityEdge display',
    750000,
    850000,
    'DEL-XPS13-001',
    18,
    (SELECT id FROM categories WHERE slug = 'electronics'),
    ARRAY['https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800'],
    'active'
  )
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();