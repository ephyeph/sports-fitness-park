-- Delete existing trails and insert new ones that stay within Central Park
DELETE FROM trails;

-- Reset the sequence
ALTER SEQUENCE trails_trail_id_seq RESTART WITH 1;

-- Insert new trails that stay within Central Park boundaries
INSERT INTO trails (name, trail_type, distance_km, difficulty_level, elevation_gain, surface_type, path_geometry) VALUES 

-- 1. Reservoir Loop - Easy running track around the Jacqueline Kennedy Onassis Reservoir
('Reservoir Loop', 'running_track', 2.5, 'easy', 10.0, 'cinder', 
 ST_GeomFromText('LINESTRING(-73.9625 40.7850, -73.9600 40.7865, -73.9570 40.7865, -73.9550 40.7850, -73.9540 40.7830, -73.9540 40.7810, -73.9550 40.7790, -73.9570 40.7775, -73.9600 40.7775, -73.9625 40.7790, -73.9640 40.7810, -73.9640 40.7830, -73.9625 40.7850)', 4326)),

-- 2. The Mall to Bethesda Fountain - Easy walking path
('Mall to Bethesda Walk', 'walking_path', 1.2, 'easy', 5.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9712 40.7685, -73.9710 40.7700, -73.9708 40.7715, -73.9706 40.7730, -73.9711 40.7740, -73.9715 40.7745)', 4326)),

-- 3. Great Lawn Loop - Moderate fitness trail around the Great Lawn
('Great Lawn Circuit', 'fitness_trail', 1.8, 'moderate', 15.0, 'mixed', 
 ST_GeomFromText('LINESTRING(-73.9665 40.7812, -73.9650 40.7820, -73.9640 40.7830, -73.9640 40.7840, -73.9650 40.7850, -73.9665 40.7855, -73.9680 40.7850, -73.9690 40.7840, -73.9690 40.7830, -73.9680 40.7820, -73.9665 40.7812)', 4326)),

-- 4. Sheep Meadow to Tavern on the Green - Easy bike path
('West Side Path', 'bike_path', 2.0, 'easy', 8.0, 'paved', 
 ST_GeomFromText('LINESTRING(-73.9755 40.7722, -73.9760 40.7730, -73.9765 40.7740, -73.9770 40.7750, -73.9775 40.7760, -73.9776 40.7725)', 4326)),

-- 5. North Woods Nature Trail - Hard hiking trail
('North Woods Trail', 'hiking_trail', 2.2, 'hard', 35.0, 'dirt', 
 ST_GeomFromText('LINESTRING(-73.9585 40.7965, -73.9580 40.7970, -73.9570 40.7975, -73.9560 40.7980, -73.9550 40.7985, -73.9540 40.7990, -73.9535 40.7995, -73.9540 40.8000, -73.9550 40.8005, -73.9560 40.8000, -73.9570 40.7995, -73.9580 40.7990, -73.9585 40.7985, -73.9590 40.7975, -73.9585 40.7965)', 4326));