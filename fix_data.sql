-- Corrected sample data with proper JSON formatting

-- Update banners (if malformed)
UPDATE settings SET value = '[{"image":"https://example.com/banner1.jpg","title":"Welcome to Mani Stores","description":"Premium quality products"},{"image":"https://example.com/banner2.jpg","title":"Fresh Dry Fruits","description":"Direct from farms"}]' WHERE `key` = 'banners';

-- Update product images to JSON arrays
UPDATE products SET images = '["https://example.com/almonds.jpg"]' WHERE slug = 'premium-almonds';
UPDATE products SET images = '["https://example.com/cashews.jpg"]' WHERE slug = 'cashews';
UPDATE products SET images = '["https://example.com/mango-pickle.jpg"]' WHERE slug = 'mango-pickle';
UPDATE products SET images = '["https://example.com/ghee.jpg"]' WHERE slug = 'pure-cow-ghee';