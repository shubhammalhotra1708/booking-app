-- Enhance sample data for better booking app experience
-- This script adds comprehensive sample data to the database

-- Update existing shop with better data
UPDATE shops 
SET 
  name = 'Elite Hair Studio',
  description = 'Premium hair styling and beauty services with expert stylists offering the latest trends in cuts, colors, and treatments.',
  image = '/s1.jpeg',
  phone = '+1-555-0123',
  email = 'info@elitehairstudio.com',
  address = '123 Main Street, Downtown',
  city = 'New York',
  rating = 4.8,
  price_range = '$$'
WHERE id = 1;

-- Add more realistic shops
INSERT INTO shops (name, description, image, phone, email, address, city, rating, price_range) VALUES 
('Glamour Beauty Salon', 'Full-service beauty salon specializing in hair, nails, and skincare treatments with a relaxing spa atmosphere.', '/s2.jpeg', '+1-555-0234', 'contact@glamourbeauty.com', '456 Oak Avenue, Midtown', 'New York', 4.6, '$$$'),
('Quick Cuts Express', 'Fast and affordable haircuts for the whole family. Walk-ins welcome with professional stylists.', '/s3.jpeg', '+1-555-0345', 'hello@quickcuts.com', '789 Pine Street, Uptown', 'New York', 4.2, '$'),
('Luxury Spa & Salon', 'High-end spa and salon experience with premium treatments, massages, and beauty services in an elegant setting.', '/s4.jpeg', '+1-555-0456', 'reservations@luxuryspa.com', '321 Cedar Boulevard, Upper East Side', 'New York', 4.9, '$$$$'),
('Modern Hair Co.', 'Contemporary hair studio featuring cutting-edge techniques, vibrant colors, and personalized styling consultations.', '/s1.jpeg', '+1-555-0567', 'style@modernhair.com', '654 Maple Drive, SoHo', 'New York', 4.7, '$$'),
('The Barbershop', 'Traditional barbershop offering classic cuts, hot towel shaves, and grooming services for the modern gentleman.', '/s2.jpeg', '+1-555-0678', 'book@thebarbershop.com', '987 Elm Street, Brooklyn', 'Brooklyn', 4.5, '$$'),
('Beauty Bliss Studio', 'Complete beauty destination with hair styling, makeup artistry, nail care, and special occasion packages.', '/s3.jpeg', '+1-555-0789', 'info@beautybliss.com', '147 Birch Lane, Queens', 'Queens', 4.4, '$$$');

-- Add comprehensive services for each shop
-- Elite Hair Studio (shop_id = 1)
DELETE FROM services WHERE shop_id = 1;
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(1, 'Signature Haircut & Style', 'Professional cut with wash, style, and finishing touches', 65.00, 60),
(1, 'Color & Highlights', 'Full color service with highlights and toning', 120.00, 120),
(1, 'Deep Conditioning Treatment', 'Intensive hair repair and moisturizing treatment', 45.00, 45),
(1, 'Bridal Hair & Makeup', 'Complete bridal styling package', 200.00, 180),
(1, 'Keratin Smoothing Treatment', 'Professional hair smoothing and straightening', 150.00, 90);

-- Glamour Beauty Salon (shop_id = 2)
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(2, 'Premium Cut & Blow Dry', 'Precision cut with professional styling', 75.00, 75),
(2, 'Balayage Color Service', 'Hand-painted highlights for natural look', 140.00, 150),
(2, 'Gel Manicure', 'Long-lasting gel nail service', 35.00, 45),
(2, 'Facial Treatment', 'Cleansing and rejuvenating facial', 80.00, 60),
(2, 'Hair Extensions', 'Professional hair extension application', 200.00, 120);

-- Quick Cuts Express (shop_id = 3)
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(3, 'Express Haircut', 'Quick and professional haircut', 25.00, 30),
(3, 'Wash & Cut Package', 'Haircut with shampoo and basic styling', 35.00, 45),
(3, 'Kids Haircut', 'Gentle haircut for children under 12', 20.00, 30),
(3, 'Beard Trim', 'Professional beard shaping and trimming', 15.00, 20),
(3, 'Basic Color Touch-up', 'Root touch-up and basic coloring', 45.00, 60);

-- Luxury Spa & Salon (shop_id = 4)
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(4, 'Luxury Hair Experience', 'Premium cut, style, and treatment package', 150.00, 120),
(4, 'Platinum Color Service', 'High-end color with premium products', 200.00, 180),
(4, 'Relaxation Massage', 'Full body therapeutic massage', 120.00, 90),
(4, 'Luxury Facial Package', 'Multi-step premium facial treatment', 150.00, 90),
(4, 'Spa Day Package', 'Complete spa experience with multiple services', 350.00, 240);

-- Modern Hair Co. (shop_id = 5)
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(5, 'Creative Cut & Style', 'Innovative cutting techniques and styling', 80.00, 75),
(5, 'Vivid Color Transformation', 'Bold and creative color services', 160.00, 150),
(5, 'Hair Art & Design', 'Unique styling and hair art creation', 100.00, 90),
(5, 'Consultation & Restyle', 'Personalized styling consultation', 90.00, 60),
(5, 'Special Event Styling', 'Custom styling for special occasions', 85.00, 75);

-- The Barbershop (shop_id = 6)
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(6, 'Classic Gentlemans Cut', 'Traditional barbershop haircut', 40.00, 45),
(6, 'Hot Towel Shave', 'Traditional straight razor shave with hot towel', 35.00, 30),
(6, 'Cut & Shave Combo', 'Haircut and shave package', 65.00, 75),
(6, 'Beard Grooming Service', 'Professional beard styling and maintenance', 30.00, 30),
(6, 'Father & Son Package', 'Haircuts for dad and child', 60.00, 60);

-- Beauty Bliss Studio (shop_id = 7)
INSERT INTO services (shop_id, name, description, price, duration) VALUES 
(7, 'Complete Makeover', 'Hair, makeup, and nail service package', 180.00, 150),
(7, 'Wedding Party Package', 'Group styling for bridal parties', 120.00, 90),
(7, 'Prom Styling', 'Special occasion hair and makeup', 95.00, 90),
(7, 'Acrylic Nail Art', 'Creative nail design and art', 50.00, 60),
(7, 'Eyebrow Shaping & Tinting', 'Professional brow services', 40.00, 30);

-- Add staff members for each shop
-- Elite Hair Studio staff
DELETE FROM staff WHERE shop_id = 1;
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(1, 'Sarah Johnson', 'Senior Stylist', 'Color Specialist, Bridal Styling', 'Award-winning stylist with 8 years of experience in advanced color techniques and bridal styling.', '/staff1.jpg', 4.9),
(1, 'Michael Chen', 'Hair Artist', 'Creative Cuts, Hair Extensions', 'Creative hair artist specializing in modern cuts and premium extension services.', '/staff2.jpg', 4.8),
(1, 'Emma Rodriguez', 'Color Specialist', 'Balayage, Color Correction', 'Expert colorist with advanced certification in balayage and color correction techniques.', '/staff3.jpg', 4.7);

-- Glamour Beauty Salon staff
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(2, 'Jessica Miller', 'Master Stylist', 'Precision Cuts, Keratin Treatments', 'Master stylist with 10+ years experience in precision cutting and smoothing treatments.', '/staff4.jpg', 4.8),
(2, 'David Kim', 'Nail Technician', 'Gel Manicures, Nail Art', 'Certified nail technician specializing in gel services and creative nail art designs.', '/staff5.jpg', 4.6),
(2, 'Lisa Thompson', 'Esthetician', 'Facial Treatments, Skincare', 'Licensed esthetician with expertise in anti-aging and rejuvenating facial treatments.', '/staff6.jpg', 4.7);

-- Quick Cuts Express staff
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(3, 'Tony Martinez', 'Lead Barber', 'Quick Cuts, Family Services', 'Experienced barber providing fast, quality cuts for the whole family.', '/staff7.jpg', 4.3),
(3, 'Amanda Wilson', 'Stylist', 'Womens Cuts, Kids Styling', 'Friendly stylist specializing in family haircare and childrens styling.', '/staff8.jpg', 4.2);

-- Luxury Spa & Salon staff
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(4, 'Victoria Sterling', 'Luxury Stylist', 'Premium Services, Color Artistry', 'Elite stylist trained in European techniques, specializing in luxury color services.', '/staff9.jpg', 4.9),
(4, 'James Patterson', 'Spa Therapist', 'Massage Therapy, Wellness', 'Licensed massage therapist with expertise in therapeutic and relaxation techniques.', '/staff10.jpg', 4.8),
(4, 'Sophia Chen', 'Beauty Specialist', 'Facial Treatments, Anti-aging', 'Advanced esthetician specializing in luxury facial treatments and skincare.', '/staff11.jpg', 4.9);

-- Modern Hair Co. staff
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(5, 'Alex Rivera', 'Creative Director', 'Avant-garde Styling, Color Art', 'Innovative stylist pushing boundaries in creative cuts and artistic color work.', '/staff12.jpg', 4.8),
(5, 'Maya Patel', 'Color Artist', 'Vivid Colors, Creative Techniques', 'Specialist in bold color transformations and creative styling techniques.', '/staff13.jpg', 4.7);

-- The Barbershop staff
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(6, 'Frank Anderson', 'Master Barber', 'Classic Cuts, Traditional Shaves', 'Traditional barber with 15 years experience in classic cuts and hot towel shaves.', '/staff14.jpg', 4.6),
(6, 'Roberto Garcia', 'Barber', 'Modern Cuts, Beard Grooming', 'Skilled barber combining traditional techniques with modern styling.', '/staff15.jpg', 4.4);

-- Beauty Bliss Studio staff
INSERT INTO staff (shop_id, name, role, specialties, bio, image, rating) VALUES 
(7, 'Rachel Green', 'Beauty Director', 'Complete Makeovers, Bridal', 'Expert in complete beauty transformations and special occasion styling.', '/staff16.jpg', 4.5),
(7, 'Carlos Mendez', 'Makeup Artist', 'Special Events, Photography', 'Professional makeup artist specializing in events and photo-ready looks.', '/staff17.jpg', 4.4),
(7, 'Nina Foster', 'Nail Artist', 'Nail Art, Creative Designs', 'Creative nail artist known for intricate designs and artistic nail work.', '/staff18.jpg', 4.3);