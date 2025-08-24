-- Central Park NYC Sports & Fitness Data
-- Run this SQL after creating your tables to populate with Central Park data

-- Clear existing data (optional - remove if you want to keep existing data)
TRUNCATE TABLE user_checkins, users, facilities, trails, amenities, weather_data RESTART IDENTITY CASCADE;

-- ===========================================
-- CENTRAL PARK FACILITIES
-- Center coordinates: -73.9654 (longitude), 40.7829 (latitude)
-- ===========================================

INSERT INTO facilities (name, facility_type, capacity, surface_type, has_lighting, accessible, location) VALUES 
-- Basketball Courts
('North Meadow Basketball Courts', 'basketball_court', 30, 'asphalt', true, true, ST_GeomFromText('POINT(-73.9588 40.7974)', 4326)),
('Great Lawn Basketball Courts', 'basketball_court', 20, 'asphalt', true, true, ST_GeomFromText('POINT(-73.9665 40.7812)', 4326)),
('West 100th Street Basketball', 'basketball_court', 15, 'asphalt', true, false, ST_GeomFromText('POINT(-73.9621 40.7950)', 4326)),

-- Tennis Courts
('Central Park Tennis Center', 'tennis_court', 60, 'hard court', true, true, ST_GeomFromText('POINT(-73.9620 40.7935)', 4326)),
('96th Street Clay Courts', 'tennis_court', 16, 'clay', true, true, ST_GeomFromText('POINT(-73.9608 40.7922)', 4326)),

-- Soccer Fields
('North Meadow Soccer Field 1', 'soccer_field', 30, 'grass', true, true, ST_GeomFromText('POINT(-73.9575 40.7965)', 4326)),
('North Meadow Soccer Field 2', 'soccer_field', 30, 'grass', true, true, ST_GeomFromText('POINT(-73.9582 40.7960)', 4326)),
('Great Lawn Softball Fields', 'soccer_field', 25, 'grass', false, true, ST_GeomFromText('POINT(-73.9680 40.7825)', 4326)),

-- Volleyball Courts
('Sheep Meadow Volleyball', 'volleyball_court', 12, 'sand', false, true, ST_GeomFromText('POINT(-73.9755 40.7722)', 4326)),
('North Meadow Volleyball', 'volleyball_court', 8, 'sand', true, true, ST_GeomFromText('POINT(-73.9595 40.7955)', 4326)),

-- Fitness Areas
('Mall Fitness Zone', 'fitness_area', 50, 'rubber', false, true, ST_GeomFromText('POINT(-73.9712 40.7742)', 4326)),
('Reservoir Fitness Station', 'fitness_area', 30, 'rubber', false, true, ST_GeomFromText('POINT(-73.9625 40.7850)', 4326)),
('Columbus Circle Exercise Area', 'fitness_area', 25, 'concrete', true, true, ST_GeomFromText('POINT(-73.9818 40.7685)', 4326)),

-- Playgrounds
('Heckscher Playground', 'playground', 100, 'rubber', true, true, ST_GeomFromText('POINT(-73.9771 40.7688)', 4326)),
('Ancient Playground', 'playground', 75, 'rubber', false, true, ST_GeomFromText('POINT(-73.9595 40.7898)', 4326)),
('Diana Ross Playground', 'playground', 60, 'rubber', true, true, ST_GeomFromText('POINT(-73.9556 40.7978)', 4326));

-- ===========================================
-- CENTRAL PARK TRAILS
-- ===========================================

INSERT INTO trails (name, trail_type, distance_km, difficulty_level, elevation_gain, surface_type, path_geometry) VALUES 
-- Running Tracks
('Reservoir Running Track', 'running_track', 2.5, 'easy', 10.0, 'cinder', 
 ST_GeomFromText('LINESTRING(-73.9625 40.7850, -73.9580 40.7870, -73.9560 40.7845, -73.9580 40.7820, -73.9625 40.7810, -73.9650 40.7835, -73.9625 40.7850)', 4326)),

('Central Park Loop', 'running_track', 10.0, 'moderate', 35.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9818 40.7685, -73.9730 40.7640, -73.9580 40.7640, -73.9490 40.7736, -73.9490 40.8000, -73.9580 40.8030, -73.9730 40.8000, -73.9818 40.7685)', 4326)),

('Bridle Path', 'running_track', 7.0, 'easy', 20.0, 'dirt', 
 ST_GeomFromText('LINESTRING(-73.9750 40.7700, -73.9700 40.7750, -73.9650 40.7800, -73.9600 40.7850, -73.9550 40.7900, -73.9500 40.7950)', 4326)),

-- Walking Paths
('The Mall Walk', 'walking_path', 0.8, 'easy', 5.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9712 40.7685, -73.9710 40.7720, -73.9708 40.7742)', 4326)),

('Bow Bridge Path', 'walking_path', 1.2, 'easy', 8.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9718 40.7755, -73.9720 40.7760, -73.9722 40.7765, -73.9725 40.7770)', 4326)),

('Conservatory Garden Path', 'walking_path', 1.5, 'easy', 12.0, 'gravel', 
 ST_GeomFromText('LINESTRING(-73.9520 40.7940, -73.9515 40.7950, -73.9510 40.7960, -73.9505 40.7970)', 4326)),

-- Bike Paths
('West Drive Bike Path', 'bike_path', 2.8, 'moderate', 25.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9818 40.7685, -73.9780 40.7730, -73.9760 40.7800, -73.9730 40.7850, -73.9700 40.7900)', 4326)),

('East Drive Bike Path', 'bike_path', 2.8, 'moderate', 25.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9490 40.7736, -73.9510 40.7800, -73.9530 40.7850, -73.9550 40.7900, -73.9570 40.7950)', 4326)),

-- Hiking Trails
('The Ramble Trail', 'hiking_trail', 2.5, 'moderate', 30.0, 'dirt', 
 ST_GeomFromText('LINESTRING(-73.9700 40.7770, -73.9690 40.7780, -73.9680 40.7790, -73.9670 40.7800, -73.9660 40.7810)', 4326)),

('North Woods Trail', 'hiking_trail', 3.5, 'hard', 45.0, 'dirt', 
 ST_GeomFromText('LINESTRING(-73.9580 40.7950, -73.9570 40.7970, -73.9560 40.7990, -73.9550 40.8010, -73.9540 40.8030)', 4326)),

-- Fitness Trails
('Sheep Meadow Circuit', 'fitness_trail', 1.8, 'easy', 10.0, 'grass', 
 ST_GeomFromText('LINESTRING(-73.9755 40.7722, -73.9740 40.7710, -73.9720 40.7700, -73.9740 40.7730, -73.9755 40.7722)', 4326));

-- ===========================================
-- CENTRAL PARK AMENITIES
-- ===========================================

INSERT INTO amenities (amenity_type, name, accessible, location) VALUES 
-- Restrooms
('restroom', 'Heckscher Playground Restroom', true, ST_GeomFromText('POINT(-73.9771 40.7688)', 4326)),
('restroom', 'Bethesda Fountain Restroom', true, ST_GeomFromText('POINT(-73.9711 40.7740)', 4326)),
('restroom', 'Delacorte Theater Restroom', true, ST_GeomFromText('POINT(-73.9689 40.7803)', 4326)),
('restroom', 'North Meadow Restroom', true, ST_GeomFromText('POINT(-73.9585 40.7965)', 4326)),
('restroom', 'Conservatory Garden Restroom', false, ST_GeomFromText('POINT(-73.9520 40.7945)', 4326)),
('restroom', 'Tennis Center Restroom', true, ST_GeomFromText('POINT(-73.9620 40.7935)', 4326)),

-- Water Fountains
('water_fountain', 'Mall Water Fountain', true, ST_GeomFromText('POINT(-73.9710 40.7730)', 4326)),
('water_fountain', 'Sheep Meadow Fountain', true, ST_GeomFromText('POINT(-73.9750 40.7720)', 4326)),
('water_fountain', 'Great Lawn Fountain North', true, ST_GeomFromText('POINT(-73.9665 40.7820)', 4326)),
('water_fountain', 'Great Lawn Fountain South', true, ST_GeomFromText('POINT(-73.9665 40.7805)', 4326)),
('water_fountain', 'Reservoir Fountain East', true, ST_GeomFromText('POINT(-73.9560 40.7850)', 4326)),
('water_fountain', 'Reservoir Fountain West', true, ST_GeomFromText('POINT(-73.9690 40.7850)', 4326)),
('water_fountain', 'North Meadow Fountain', false, ST_GeomFromText('POINT(-73.9580 40.7960)', 4326)),

-- Parking
('parking', 'Central Park West Parking', true, ST_GeomFromText('POINT(-73.9825 40.7700)', 4326)),
('parking', 'Fifth Avenue Parking', true, ST_GeomFromText('POINT(-73.9485 40.7750)', 4326)),
('parking', 'Columbus Circle Garage', true, ST_GeomFromText('POINT(-73.9820 40.7680)', 4326)),

-- Benches
('bench', 'Literary Walk Benches', true, ST_GeomFromText('POINT(-73.9712 40.7705)', 4326)),
('bench', 'Bethesda Terrace Benches', true, ST_GeomFromText('POINT(-73.9711 40.7738)', 4326)),
('bench', 'Bow Bridge Benches', false, ST_GeomFromText('POINT(-73.9718 40.7758)', 4326)),
('bench', 'Cherry Hill Benches', true, ST_GeomFromText('POINT(-73.9732 40.7765)', 4326)),

-- Bike Racks
('bike_rack', 'Columbus Circle Bike Rack', true, ST_GeomFromText('POINT(-73.9818 40.7685)', 4326)),
('bike_rack', 'Engineers Gate Bike Rack', true, ST_GeomFromText('POINT(-73.9530 40.7880)', 4326)),
('bike_rack', 'Tavern on Green Bike Rack', true, ST_GeomFromText('POINT(-73.9776 40.7725)', 4326)),

-- Information Kiosks
('information_kiosk', 'Columbus Circle Info Center', true, ST_GeomFromText('POINT(-73.9819 40.7686)', 4326)),
('information_kiosk', 'Dairy Visitor Center', true, ST_GeomFromText('POINT(-73.9743 40.7690)', 4326)),

-- First Aid Stations
('first_aid', 'Belvedere Castle First Aid', true, ST_GeomFromText('POINT(-73.9692 40.7794)', 4326)),
('first_aid', 'North Meadow First Aid', false, ST_GeomFromText('POINT(-73.9585 40.7968)', 4326)),

-- Picnic Tables
('picnic_table', 'Sheep Meadow Picnic Area', true, ST_GeomFromText('POINT(-73.9745 40.7715)', 4326)),
('picnic_table', 'Great Lawn Picnic Area', true, ST_GeomFromText('POINT(-73.9670 40.7815)', 4326)),
('picnic_table', 'Harlem Meer Picnic Area', true, ST_GeomFromText('POINT(-73.9510 40.7960)', 4326));

-- ===========================================
-- SAMPLE WEATHER DATA FOR NYC
-- ===========================================

INSERT INTO weather_data (temperature, weather_condition, precipitation, suitable_for_outdoor) VALUES 
(18.5, 'partly_cloudy', 'none', true),
(22.0, 'sunny', 'none', true),
(15.2, 'cloudy', 'light', true);

-- ===========================================
-- SAMPLE USERS AND CHECK-INS
-- ===========================================

-- Sample Users
INSERT INTO users (username, email) VALUES 
('nyc_runner', 'runner@email.com'),
('tennis_pro', 'tennis@email.com'),
('family_fun', 'family@email.com'),
('morning_jogger', 'jogger@email.com'),
('basketball_fan', 'hoops@email.com');

-- Sample Check-ins to show activity
INSERT INTO user_checkins (user_id, facility_id, activity_type, party_size, notes, checkin_location, checkin_time) VALUES 
(1, 1, 'basketball', 5, 'Morning pickup game', ST_GeomFromText('POINT(-73.9588 40.7974)', 4326), NOW() - INTERVAL '2 hours'),
(2, 4, 'tennis', 2, 'Doubles match', ST_GeomFromText('POINT(-73.9620 40.7935)', 4326), NOW() - INTERVAL '1 hour'),
(3, 14, 'playground', 4, 'Kids birthday party', ST_GeomFromText('POINT(-73.9771 40.7688)', 4326), NOW() - INTERVAL '30 minutes'),
(4, NULL, 1, 'running', 1, 'Morning jog around reservoir', ST_GeomFromText('POINT(-73.9625 40.7850)', 4326), NOW() - INTERVAL '45 minutes'),
(5, 2, 'basketball', 8, 'Weekend tournament', ST_GeomFromText('POINT(-73.9665 40.7812)', 4326), NOW() - INTERVAL '90 minutes');