-- Sports & Fitness Park Database Schema
-- PostgreSQL with PostGIS Extension

-- Enable PostGIS extension for spatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create database (run this separately if needed)
-- CREATE DATABASE sports_fitness_park;

-- ===========================================
-- TABLE 1: USERS
-- ===========================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- TABLE 2: FACILITIES 
-- ===========================================
CREATE TABLE facilities (
    facility_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    facility_type VARCHAR(50) NOT NULL, -- 'basketball_court', 'tennis_court', 'soccer_field', etc.
    capacity INTEGER NOT NULL DEFAULT 0,
    surface_type VARCHAR(50), -- 'asphalt', 'grass', 'concrete', 'rubber', etc.
    has_lighting BOOLEAN DEFAULT FALSE,
    accessible BOOLEAN DEFAULT FALSE,
    location GEOMETRY(POINT, 4326) NOT NULL, -- PostGIS spatial column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_capacity CHECK (capacity >= 0),
    CONSTRAINT chk_facility_type CHECK (facility_type IN (
        'basketball_court', 'tennis_court', 'soccer_field', 'volleyball_court',
        'baseball_field', 'fitness_area', 'playground', 'skate_park'
    ))
);

-- ===========================================
-- TABLE 3: TRAILS
-- ===========================================
CREATE TABLE trails (
    trail_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    trail_type VARCHAR(50) NOT NULL, -- 'running_track', 'hiking_trail', 'bike_path', etc.
    distance_km DECIMAL(5,2) NOT NULL,
    difficulty_level VARCHAR(20) NOT NULL,
    elevation_gain DECIMAL(6,2) DEFAULT 0, -- in meters
    surface_type VARCHAR(50), -- 'paved', 'gravel', 'dirt', 'grass', etc.
    path_geometry GEOMETRY(LINESTRING, 4326) NOT NULL, -- PostGIS spatial column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_distance CHECK (distance_km > 0),
    CONSTRAINT chk_difficulty CHECK (difficulty_level IN ('easy', 'moderate', 'hard')),
    CONSTRAINT chk_trail_type CHECK (trail_type IN (
        'running_track', 'hiking_trail', 'bike_path', 'walking_path', 'fitness_trail'
    ))
);

-- ===========================================
-- TABLE 4: AMENITIES
-- ===========================================
CREATE TABLE amenities (
    amenity_id SERIAL PRIMARY KEY,
    amenity_type VARCHAR(50) NOT NULL, -- 'restroom', 'water_fountain', 'parking', etc.
    name VARCHAR(100) NOT NULL,
    accessible BOOLEAN DEFAULT FALSE,
    location GEOMETRY(POINT, 4326) NOT NULL, -- PostGIS spatial column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_amenity_type CHECK (amenity_type IN (
        'restroom', 'water_fountain', 'parking', 'first_aid', 'picnic_table',
        'bench', 'bike_rack', 'trash_bin', 'information_kiosk'
    ))
);

-- ===========================================
-- TABLE 5: USER_CHECKINS (User Submission Data)
-- ===========================================
CREATE TABLE user_checkins (
    checkin_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    facility_id INTEGER REFERENCES facilities(facility_id) ON DELETE CASCADE,
    trail_id INTEGER REFERENCES trails(trail_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'basketball', 'running', 'walking', etc.
    checkin_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checkout_time TIMESTAMP,
    party_size INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    checkin_location GEOMETRY(POINT, 4326), -- PostGIS spatial column
    
    -- Constraints
    CONSTRAINT chk_party_size CHECK (party_size > 0),
    CONSTRAINT chk_checkout_after_checkin CHECK (checkout_time IS NULL OR checkout_time >= checkin_time),
    CONSTRAINT chk_facility_or_trail CHECK (
        (facility_id IS NOT NULL AND trail_id IS NULL) OR 
        (facility_id IS NULL AND trail_id IS NOT NULL)
    ),
    CONSTRAINT chk_activity_type CHECK (activity_type IN (
        'basketball', 'tennis', 'soccer', 'volleyball', 'running', 'walking',
        'cycling', 'fitness', 'playground', 'general_recreation'
    ))
);

-- ===========================================
-- TABLE 6: WEATHER_DATA
-- ===========================================
CREATE TABLE weather_data (
    weather_id SERIAL PRIMARY KEY,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    temperature DECIMAL(5,2), -- in Celsius
    weather_condition VARCHAR(50) NOT NULL, -- 'sunny', 'cloudy', 'rainy', etc.
    precipitation VARCHAR(20), -- 'none', 'light', 'moderate', 'heavy'
    suitable_for_outdoor BOOLEAN DEFAULT TRUE,
    
    -- Constraints
    CONSTRAINT chk_weather_condition CHECK (weather_condition IN (
        'sunny', 'cloudy', 'partly_cloudy', 'rainy', 'stormy', 'snowy', 'foggy'
    )),
    CONSTRAINT chk_precipitation CHECK (precipitation IN (
        'none', 'light', 'moderate', 'heavy'
    ))
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Spatial indexes for PostGIS columns
CREATE INDEX idx_facilities_location ON facilities USING GIST(location);
CREATE INDEX idx_trails_path ON trails USING GIST(path_geometry);
CREATE INDEX idx_amenities_location ON amenities USING GIST(location);
CREATE INDEX idx_checkins_location ON user_checkins USING GIST(checkin_location);

-- Regular indexes for common queries
CREATE INDEX idx_facilities_type ON facilities(facility_type);
CREATE INDEX idx_trails_type ON trails(trail_type);
CREATE INDEX idx_amenities_type ON amenities(amenity_type);
CREATE INDEX idx_checkins_user ON user_checkins(user_id);
CREATE INDEX idx_checkins_facility ON user_checkins(facility_id);
CREATE INDEX idx_checkins_trail ON user_checkins(trail_id);
CREATE INDEX idx_checkins_time ON user_checkins(checkin_time);
CREATE INDEX idx_weather_time ON weather_data(recorded_at);

-- ===========================================
-- SAMPLE DATA INSERT STATEMENTS
-- ===========================================

-- Sample Users
INSERT INTO users (username, email) VALUES 
('sports_fan_123', 'john.doe@email.com'),
('fitness_runner', 'jane.smith@email.com'),
('weekend_warrior', 'mike.jones@email.com');

-- Sample Facilities (using example coordinates)
INSERT INTO facilities (name, facility_type, capacity, surface_type, has_lighting, accessible, location) VALUES 
('North Basketball Court', 'basketball_court', 10, 'asphalt', true, true, ST_GeomFromText('POINT(-85.7585 40.1164)', 4326)),
('Tennis Court A', 'tennis_court', 4, 'concrete', true, false, ST_GeomFromText('POINT(-85.7590 40.1160)', 4326)),
('Soccer Field Main', 'soccer_field', 22, 'grass', true, true, ST_GeomFromText('POINT(-85.7580 40.1170)', 4326));

-- Sample Trails
INSERT INTO trails (name, trail_type, distance_km, difficulty_level, elevation_gain, surface_type, path_geometry) VALUES 
('Fitness Loop', 'running_track', 1.5, 'easy', 5.0, 'paved', ST_GeomFromText('LINESTRING(-85.7585 40.1164, -85.7590 40.1170, -85.7580 40.1175)', 4326)),
('Nature Trail', 'hiking_trail', 3.2, 'moderate', 45.0, 'dirt', ST_GeomFromText('LINESTRING(-85.7575 40.1160, -85.7565 40.1180, -85.7555 40.1185)', 4326));

-- Sample Amenities
INSERT INTO amenities (amenity_type, name, accessible, location) VALUES 
('restroom', 'Main Restroom Building', true, ST_GeomFromText('POINT(-85.7582 40.1167)', 4326)),
('water_fountain', 'Court-side Water Fountain', true, ST_GeomFromText('POINT(-85.7587 40.1162)', 4326)),
('parking', 'Main Parking Lot', true, ST_GeomFromText('POINT(-85.7595 40.1155)', 4326));

-- Sample Weather Data
INSERT INTO weather_data (temperature, weather_condition, precipitation, suitable_for_outdoor) VALUES 
(22.5, 'sunny', 'none', true),
(18.0, 'cloudy', 'none', true),
(15.2, 'rainy', 'light', false);

-- Sample User Check-ins
INSERT INTO user_checkins (user_id, facility_id, activity_type, party_size, notes, checkin_location) VALUES 
(1, 1, 'basketball', 2, 'Playing pickup game', ST_GeomFromText('POINT(-85.7585 40.1164)', 4326)),
(2, 2, 'tennis', 1, 'Solo practice session', ST_GeomFromText('POINT(-85.7590 40.1160)', 4326));

INSERT INTO user_checkins (user_id, trail_id, activity_type, party_size, notes, checkin_location) VALUES 
(3, 1, 'running', 1, 'Morning jog', ST_GeomFromText('POINT(-85.7585 40.1164)', 4326));

-- ===========================================
-- USEFUL QUERIES FOR DEVELOPMENT
-- ===========================================

-- Query 1: Find all active check-ins (not checked out)
-- SELECT * FROM user_checkins WHERE checkout_time IS NULL;

-- Query 2: Get current occupancy for a facility
-- SELECT f.name, COUNT(uc.checkin_id) as current_occupancy
-- FROM facilities f
-- LEFT JOIN user_checkins uc ON f.facility_id = uc.facility_id 
-- WHERE uc.checkout_time IS NULL
-- GROUP BY f.facility_id, f.name;

-- Query 3: Find facilities within 100 meters of a point
-- SELECT * FROM facilities 
-- WHERE ST_DWithin(location, ST_GeomFromText('POINT(-85.7585 40.1164)', 4326), 100);

-- Query 4: Get latest weather data
-- SELECT * FROM weather_data ORDER BY recorded_at DESC LIMIT 1;