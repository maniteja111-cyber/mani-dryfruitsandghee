-- Sample data for Mani Dry Fruits Pickles and Ghee Stores

-- Insert categories
INSERT INTO categories (id, name, slug, description, image, createdAt, updatedAt) VALUES
('cat1', 'Dry Fruits', 'dry-fruits', 'Premium quality dry fruits from around the world', NULL, NOW(), NOW()),
('cat2', 'Pickles', 'pickles', 'Authentic Indian pickles made with traditional recipes', NULL, NOW(), NOW()),
('cat3', 'Ghee', 'ghee', 'Pure and fresh ghee made from cow milk', NULL, NOW(), NOW());

-- Insert products
INSERT INTO products (id, name, slug, description, price, discountPrice, stock, images, categoryId, createdAt, updatedAt) VALUES
('prod1', 'Premium Almonds', 'premium-almonds', 'High-quality almonds rich in nutrients', 800, 720, 100, '["https://example.com/almonds.jpg"]', 'cat1', NOW(), NOW()),
('prod2', 'Cashews', 'cashews', 'Delicious cashews perfect for snacking', 1200, NULL, 50, '["https://example.com/cashews.jpg"]', 'cat1', NOW(), NOW()),
('prod3', 'Mango Pickle', 'mango-pickle', 'Spicy mango pickle made with traditional spices', 250, NULL, 30, '["https://example.com/mango-pickle.jpg"]', 'cat2', NOW(), NOW()),
('prod4', 'Pure Cow Ghee', 'pure-cow-ghee', '100% pure ghee made from cow milk', 600, 550, 20, '["https://example.com/ghee.jpg"]', 'cat3', NOW(), NOW());

-- Insert settings
INSERT INTO settings (id, `key`, value) VALUES
('set1', 'siteName', 'Mani Dry Fruits Pickles and Ghee Stores'),
('set2', 'logo', 'https://example.com/logo.png'),
('set3', 'themeColor', '#ffd862'),
('set4', 'whatsappNumber', '919876543210'),
('set5', 'phone', '+91 
5 43210'),
('set6', 'email', 'info@manidryfruits.com'),
('set7', 'address', '123 Main Street, City, State 123456'),
('set8', 'banners', '[{"image":"https://example.com/banner1.jpg","title":"Welcome to Mani Stores","description":"Premium quality products"},{"image":"https://example.com/banner2.jpg","title":"Fresh Dry Fruits","description":"Direct from farms"}]'),
('set9', 'seoTitle', 'Mani Dry Fruits Pickles and Ghee Stores - Premium Quality Products'),
('set10', 'seoDescription', 'Shop for premium dry fruits, authentic pickles, and pure ghee. Fast delivery across India.'),
('set11', 'heroTitle', 'Premium Dry Fruits & Pure Ghee'),
('set12', 'heroSubtitle', 'Healthy products delivered to your doorstep'),
('set13', 'featuredProducts', '["prod1", "prod2", "prod3", "prod4"]'),
('set14', 'todaysOffers', '["prod3", "prod1", "prod2", "prod4"]');

-- Insert admin user
INSERT INTO users (id, phone, name, password, createdAt, updatedAt) VALUES
('user_admin', '9999999999', 'Admin', '$2b$10$dummy.hash.for.admin', NOW(), NOW());