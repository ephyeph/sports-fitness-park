// server.js - Backend API for Sports & Fitness Park
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'sports_fitness_park',
    password: process.env.DB_PASSWORD || 'saltysalty',
    port: process.env.DB_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log('Database connected successfully');
    }
});

// ===========================================
// API ROUTES
// ===========================================

// Get all facilities or filter by type
app.get('/api/facilities', async (req, res) => {
    try {
        const { type } = req.query;
        let query = `
            SELECT 
                facility_id,
                name,
                facility_type,
                capacity,
                surface_type,
                has_lighting,
                accessible,
                ST_Y(location) as latitude,
                ST_X(location) as longitude
            FROM facilities
        `;
        
        const params = [];
        if (type) {
            query += ' WHERE facility_type = $1';
            params.push(type);
        }
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching facilities:', error);
        res.status(500).json({ error: 'Failed to fetch facilities' });
    }
});

// Get all trails or filter by difficulty
app.get('/api/trails', async (req, res) => {
    try {
        const { difficulty } = req.query;
        let query = `
            SELECT 
                trail_id,
                name,
                trail_type,
                distance_km,
                difficulty_level,
                elevation_gain,
                surface_type,
                ST_AsGeoJSON(path_geometry) as path_coordinates
            FROM trails
        `;
        
        const params = [];
        if (difficulty) {
            query += ' WHERE difficulty_level = $1';
            params.push(difficulty);
        }
        
        const result = await pool.query(query, params);
        
        // Parse GeoJSON for path coordinates
        const trails = result.rows.map(trail => ({
            ...trail,
            path_coordinates: JSON.parse(trail.path_coordinates)
        }));
        
        res.json(trails);
    } catch (error) {
        console.error('Error fetching trails:', error);
        res.status(500).json({ error: 'Failed to fetch trails' });
    }
});

// Get all amenities
app.get('/api/amenities', async (req, res) => {
    try {
        const query = `
            SELECT 
                amenity_id,
                amenity_type,
                name,
                accessible,
                ST_Y(location) as latitude,
                ST_X(location) as longitude
            FROM amenities
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching amenities:', error);
        res.status(500).json({ error: 'Failed to fetch amenities' });
    }
});

// Submit user check-in (with validation)
app.post('/api/checkins', async (req, res) => {
    try {
        const {
            user_name,
            activity_type,
            party_size,
            notes,
            facility_id,
            trail_id,
            checkin_location
        } = req.body;
        
        // Validation
        if (!user_name || !activity_type || !party_size) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        if (!facility_id && !trail_id) {
            return res.status(400).json({ error: 'Must select either a facility or trail' });
        }
        
        if (facility_id && trail_id) {
            return res.status(400).json({ error: 'Cannot select both facility and trail' });
        }
        
        if (party_size < 1 || party_size > 50) {
            return res.status(400).json({ error: 'Party size must be between 1 and 50' });
        }
        
        // Check if user exists, if not create new user
        let userResult = await pool.query(
            'SELECT user_id FROM users WHERE username = $1',
            [user_name]
        );
        
        let userId;
        if (userResult.rows.length === 0) {
            // Create new user
            const newUserResult = await pool.query(
                'INSERT INTO users (username, email) VALUES ($1, $2) RETURNING user_id',
                [user_name, `${user_name}@parkuser.com`]
            );
            userId = newUserResult.rows[0].user_id;
        } else {
            userId = userResult.rows[0].user_id;
        }
        
        // Create check-in
        let locationPoint = null;
        if (checkin_location && checkin_location.coordinates) {
            locationPoint = `POINT(${checkin_location.coordinates[0]} ${checkin_location.coordinates[1]})`;
        }
        
        const insertQuery = `
            INSERT INTO user_checkins 
            (user_id, facility_id, trail_id, activity_type, party_size, notes, checkin_location)
            VALUES ($1, $2, $3, $4, $5, $6, ${locationPoint ? 'ST_GeomFromText($7, 4326)' : 'NULL'})
            RETURNING checkin_id
        `;
        
        const params = [userId, facility_id, trail_id, activity_type, party_size, notes];
        if (locationPoint) {
            params.push(locationPoint);
        }
        
        const checkinResult = await pool.query(insertQuery, params);
        
        res.json({
            success: true,
            checkin_id: checkinResult.rows[0].checkin_id,
            message: 'Check-in successful!'
        });
        
    } catch (error) {
        console.error('Error creating check-in:', error);
        res.status(500).json({ error: 'Failed to create check-in' });
    }
});

// Get facility occupancy
app.get('/api/occupancy/:facilityId', async (req, res) => {
    try {
        const { facilityId } = req.params;
        
        // Get facility capacity
        const facilityResult = await pool.query(
            'SELECT capacity FROM facilities WHERE facility_id = $1',
            [facilityId]
        );
        
        if (facilityResult.rows.length === 0) {
            return res.status(404).json({ error: 'Facility not found' });
        }
        
        const capacity = facilityResult.rows[0].capacity;
        
        // Get current occupancy (active check-ins)
        const occupancyResult = await pool.query(
            `SELECT COALESCE(SUM(party_size), 0) as current_occupancy
             FROM user_checkins
             WHERE facility_id = $1 
             AND checkout_time IS NULL
             AND checkin_time >= NOW() - INTERVAL '4 hours'`,
            [facilityId]
        );
        
        const currentOccupancy = parseInt(occupancyResult.rows[0].current_occupancy);
        const percentage = capacity > 0 ? Math.round((currentOccupancy / capacity) * 100) : 0;
        
        res.json({
            facility_id: facilityId,
            capacity: capacity,
            current: currentOccupancy,
            percentage: percentage
        });
        
    } catch (error) {
        console.error('Error fetching occupancy:', error);
        res.status(500).json({ error: 'Failed to fetch occupancy' });
    }
});

// Get weather data (mock or from external API)
app.get('/api/weather', async (req, res) => {
    try {
        // Check for recent weather data in database
        const dbWeatherResult = await pool.query(
            `SELECT * FROM weather_data 
             ORDER BY recorded_at DESC 
             LIMIT 1`
        );
        
        if (dbWeatherResult.rows.length > 0) {
            const weather = dbWeatherResult.rows[0];
            res.json({
                current: {
                    temp_c: weather.temperature,
                    condition: { text: weather.weather_condition },
                    wind_kph: 15, // Mock data
                    humidity: 65, // Mock data
                    vis_km: 10 // Mock data
                }
            });
        } else {
            // Return mock weather data if no database records
            res.json({
                current: {
                    temp_c: 22,
                    condition: { text: 'Partly cloudy' },
                    wind_kph: 12,
                    humidity: 60,
                    vis_km: 10
                }
            });
        }
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.json({ error: 'Weather data unavailable' });
    }
});

// Get activity recommendations based on weather and occupancy
app.get('/api/recommendations', async (req, res) => {
    try {
        const recommendations = [];
        
        // Get current weather
        const weatherResult = await pool.query(
            'SELECT * FROM weather_data ORDER BY recorded_at DESC LIMIT 1'
        );
        
        const weather = weatherResult.rows[0];
        const isGoodWeather = !weather || weather.suitable_for_outdoor;
        
        // Get least occupied facilities
        const facilityOccupancyQuery = `
            SELECT 
                f.facility_id,
                f.name,
                f.facility_type,
                f.capacity,
                COALESCE(SUM(uc.party_size), 0) as current_occupancy
            FROM facilities f
            LEFT JOIN user_checkins uc ON f.facility_id = uc.facility_id 
                AND uc.checkout_time IS NULL
                AND uc.checkin_time >= NOW() - INTERVAL '4 hours'
            GROUP BY f.facility_id, f.name, f.facility_type, f.capacity
            HAVING COALESCE(SUM(uc.party_size), 0) < f.capacity * 0.5
            ORDER BY current_occupancy ASC
            LIMIT 3
        `;
        
        const facilityResult = await pool.query(facilityOccupancyQuery);
        
        facilityResult.rows.forEach(facility => {
            recommendations.push({
                name: facility.name,
                type: 'facility',
                reason: `Low occupancy (${facility.current_occupancy}/${facility.capacity} people)`
            });
        });
        
        // Recommend trails based on weather
        if (isGoodWeather) {
            const trailResult = await pool.query(
                `SELECT name, trail_type, difficulty_level 
                 FROM trails 
                 WHERE difficulty_level = 'easy' OR difficulty_level = 'moderate'
                 LIMIT 2`
            );
            
            trailResult.rows.forEach(trail => {
                recommendations.push({
                    name: trail.name,
                    type: 'trail',
                    reason: `Perfect weather for ${trail.difficulty_level} ${trail.trail_type}`
                });
            });
        }
        
        res.json(recommendations);
        
    } catch (error) {
        console.error('Error generating recommendations:', error);
        res.status(500).json({ error: 'Failed to generate recommendations' });
    }
});

// Get user check-in history
app.get('/api/checkins/user/:username', async (req, res) => {
    try {
        const { username } = req.params;
        
        const query = `
            SELECT 
                uc.*,
                u.username,
                f.name as facility_name,
                t.name as trail_name
            FROM user_checkins uc
            JOIN users u ON uc.user_id = u.user_id
            LEFT JOIN facilities f ON uc.facility_id = f.facility_id
            LEFT JOIN trails t ON uc.trail_id = t.trail_id
            WHERE u.username = $1
            ORDER BY uc.checkin_time DESC
            LIMIT 10
        `;
        
        const result = await pool.query(query, [username]);
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error fetching user check-ins:', error);
        res.status(500).json({ error: 'Failed to fetch check-in history' });
    }
});

// Checkout endpoint
app.put('/api/checkins/:checkinId/checkout', async (req, res) => {
    try {
        const { checkinId } = req.params;
        
        const result = await pool.query(
            'UPDATE user_checkins SET checkout_time = NOW() WHERE checkin_id = $1 RETURNING *',
            [checkinId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Check-in not found' });
        }
        
        res.json({
            success: true,
            message: 'Checked out successfully',
            checkout_time: result.rows[0].checkout_time
        });
        
    } catch (error) {
        console.error('Error during checkout:', error);
        res.status(500).json({ error: 'Failed to checkout' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API endpoints available:');
    console.log('  GET  /api/facilities');
    console.log('  GET  /api/trails');
    console.log('  GET  /api/amenities');
    console.log('  POST /api/checkins');
    console.log('  GET  /api/occupancy/:facilityId');
    console.log('  GET  /api/weather');
    console.log('  GET  /api/recommendations');
    console.log('  GET  /api/checkins/user/:username');
    console.log('  PUT  /api/checkins/:checkinId/checkout');
});