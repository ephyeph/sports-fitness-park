// sports-park.js - Main application JavaScript

// Global variables
let map;
let currentLocation = null;
let selectedFacility = null;
let selectedTrail = null;
let facilitiesLayer, trailsLayer, amenitiesLayer;
let facilityMarkers = {}; // Store markers for updating

const API_BASE_URL = 'http://localhost:3000/api';

// Initialize map
function initMap() {
    // Center on Central Park, NYC
    map = L.map('map').setView([40.7829, -73.9654], 14);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Initialize layer groups
    facilitiesLayer = L.layerGroup().addTo(map);
    trailsLayer = L.layerGroup().addTo(map);
    amenitiesLayer = L.layerGroup().addTo(map);
    
    // Load initial data
    loadFacilities();
    loadTrails();
    loadAmenities();
    loadWeather();
}

// Load facilities from API with occupancy data
async function loadFacilities(type = '') {
    try {
        const url = type ? `${API_BASE_URL}/facilities?type=${type}` : `${API_BASE_URL}/facilities`;
        const response = await fetch(url);
        const facilities = await response.json();
        
        facilitiesLayer.clearLayers();
        facilityMarkers = {};
        
        for (const facility of facilities) {
            // Get occupancy for each facility
            const occupancyResponse = await fetch(`${API_BASE_URL}/occupancy/${facility.facility_id}`);
            const occupancy = await occupancyResponse.json();
            
            const marker = L.circleMarker([facility.latitude, facility.longitude], {
                color: occupancy.percentage > 80 ? '#dc3545' : occupancy.percentage > 50 ? '#ffc107' : '#28a745',
                fillColor: occupancy.percentage > 80 ? '#dc3545' : occupancy.percentage > 50 ? '#ffc107' : '#28a745',
                fillOpacity: 0.8,
                radius: 10,
                weight: 2
            }).addTo(facilitiesLayer);
            
            const popupContent = `
                <div style="min-width: 250px;">
                    <h6><strong>${facility.name}</strong></h6>
                    <p><strong>Type:</strong> ${facility.facility_type.replace(/_/g, ' ')}</p>
                    <p><strong>Capacity:</strong> ${facility.capacity} people</p>
                    <p><strong>Surface:</strong> ${facility.surface_type}</p>
                    <p><strong>Lighting:</strong> ${facility.has_lighting ? 'Yes' : 'No'}</p>
                    <p><strong>Accessible:</strong> ${facility.accessible ? 'Yes' : 'No'}</p>
                    <div style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                        <h6 style="margin-bottom: 8px;">Current Occupancy</h6>
                        <div style="background: #e9ecef; border-radius: 10px; height: 20px; overflow: hidden;">
                            <div style="background: ${occupancy.percentage > 80 ? '#dc3545' : occupancy.percentage > 50 ? '#ffc107' : '#28a745'}; 
                                        width: ${occupancy.percentage}%; height: 100%; color: white; 
                                        text-align: center; line-height: 20px; font-size: 12px;">
                                ${occupancy.current}/${occupancy.capacity}
                            </div>
                        </div>
                        <p style="margin-top: 5px; margin-bottom: 0; font-size: 14px;">
                            <strong>${occupancy.percentage}%</strong> occupied (${occupancy.current} people)
                        </p>
                    </div>
                    <button class="btn btn-sm btn-park" style="margin-top: 10px; width: 100%;" 
                            onclick="selectFacility(${facility.facility_id})">
                        Select for Check-in
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            facilityMarkers[facility.facility_id] = marker;
        }
        
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

// Load trails from API
async function loadTrails(difficulty = '') {
    try {
        const url = difficulty ? `${API_BASE_URL}/trails?difficulty=${difficulty}` : `${API_BASE_URL}/trails`;
        const response = await fetch(url);
        const trails = await response.json();
        
        trailsLayer.clearLayers();
        
        trails.forEach(trail => {
            const coords = trail.path_coordinates.coordinates.map(coord => [coord[1], coord[0]]);
            
            // Choose color based on difficulty
            let color = '#28a745'; // easy - green
            if (trail.difficulty_level === 'moderate') color = '#ffc107'; // yellow
            if (trail.difficulty_level === 'hard') color = '#dc3545'; // red
            
            const polyline = L.polyline(coords, {
                color: color,
                weight: 4,
                opacity: 0.8
            }).addTo(trailsLayer);
            
            const popupContent = `
                <div style="min-width: 200px;">
                    <h6><strong>${trail.name}</strong></h6>
                    <p><strong>Type:</strong> ${trail.trail_type.replace(/_/g, ' ')}</p>
                    <p><strong>Distance:</strong> ${trail.distance_km} km</p>
                    <p><strong>Difficulty:</strong> <span style="color: ${color}; font-weight: bold;">${trail.difficulty_level}</span></p>
                    <p><strong>Elevation Gain:</strong> ${trail.elevation_gain}m</p>
                    <p><strong>Surface:</strong> ${trail.surface_type}</p>
                    <button class="btn btn-sm btn-park" style="margin-top: 10px; width: 100%;"
                            onclick="selectTrail(${trail.trail_id})">
                        Select for Check-in
                    </button>
                </div>
            `;
            
            polyline.bindPopup(popupContent);
        });
        
    } catch (error) {
        console.error('Error loading trails:', error);
    }
}

// Load amenities from API with optional filtering
async function loadAmenities(type = '') {
    try {
        const response = await fetch(`${API_BASE_URL}/amenities`);
        let amenities = await response.json();
        
        // Filter by type if specified
        if (type) {
            amenities = amenities.filter(amenity => amenity.amenity_type === type);
        }
        
        amenitiesLayer.clearLayers();
        
        amenities.forEach(amenity => {
            // Different icons for different amenity types
            const icon = getAmenityIcon(amenity.amenity_type);
            
            const marker = L.marker([amenity.latitude, amenity.longitude], {
                icon: L.divIcon({
                    html: `<div style="font-size: 20px; text-shadow: 2px 2px 2px white;">${icon}</div>`,
                    className: 'amenity-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15]
                })
            }).addTo(amenitiesLayer);
            
            const popupContent = `
                <div>
                    <h6><strong>${amenity.name}</strong></h6>
                    <p><strong>Type:</strong> ${amenity.amenity_type.replace(/_/g, ' ')}</p>
                    <p><strong>Accessible:</strong> ${amenity.accessible ? 'Yes' : 'No'}</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        });
        
    } catch (error) {
        console.error('Error loading amenities:', error);
    }
}

// Load weather information
async function loadWeather() {
    try {
        const response = await fetch(`${API_BASE_URL}/weather`);
        const weather = await response.json();
        
        if (weather.error) {
            document.getElementById('weatherInfo').innerHTML = `
                <p class="mb-0">Weather data unavailable</p>
            `;
            return;
        }
        
        const weatherHtml = `
            <div>
                <h3 class="mb-1">${Math.round(weather.current.temp_c)}°C</h3>
                <p class="mb-2">${weather.current.condition.text}</p>
                <p class="mb-1"><i class="fas fa-wind me-1"></i> ${weather.current.wind_kph} km/h</p>
                <p class="mb-1"><i class="fas fa-tint me-1"></i> ${weather.current.humidity}%</p>
                <p class="mb-0"><i class="fas fa-eye me-1"></i> ${weather.current.vis_km} km</p>
            </div>
        `;
        
        document.getElementById('weatherInfo').innerHTML = weatherHtml;
        
    } catch (error) {
        console.error('Error loading weather:', error);
        document.getElementById('weatherInfo').innerHTML = `
            <p class="mb-0">Weather data unavailable</p>
        `;
    }
}

// Get user's current location
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                currentLocation = [lat, lng];
                
                // Add marker for user location
                L.marker(currentLocation, {
                    icon: L.icon({
                        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [41, 41]
                    })
                }).addTo(map).bindPopup('You are here!').openPopup();
                
                // Center map on user location
                map.setView(currentLocation, 16);
            },
            (error) => {
                alert('Unable to get your location. Please check your browser settings.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Filter facilities
function filterFacilities() {
    const filterValue = document.getElementById('facilityFilter').value;
    loadFacilities(filterValue);
}

// Filter trails
function filterTrails() {
    const filterValue = document.getElementById('trailFilter').value;
    loadTrails(filterValue);
}

// Select facility for check-in
function selectFacility(facilityId) {
    selectedFacility = facilityId;
    selectedTrail = null;
    document.getElementById('activityType').focus();
    showMessage('checkinMessages', 'Facility selected! Please complete the check-in form.', 'success');
    
    // Show selected facility info
    displaySelectedFeature('facility', facilityId);
}

// Select trail for check-in
function selectTrail(trailId) {
    selectedTrail = trailId;
    selectedFacility = null;
    document.getElementById('activityType').focus();
    showMessage('checkinMessages', 'Trail selected! Please complete the check-in form.', 'success');
    
    // Show selected trail info
    displaySelectedFeature('trail', trailId);
}

// Display selected feature information
async function displaySelectedFeature(type, id) {
    const featureInfo = document.getElementById('featureInfo');
    const featureTitle = document.getElementById('featureTitle');
    const featureDetails = document.getElementById('featureDetails');
    const occupancyInfo = document.getElementById('occupancyInfo');
    
    if (type === 'facility') {
        const response = await fetch(`${API_BASE_URL}/facilities`);
        const facilities = await response.json();
        const facility = facilities.find(f => f.facility_id === id);
        
        if (facility) {
            featureTitle.innerHTML = `Selected: ${facility.name}`;
            featureDetails.innerHTML = `
                <p><strong>Type:</strong> ${facility.facility_type.replace(/_/g, ' ')}</p>
                <p><strong>Ready for check-in!</strong></p>
            `;
            
            // Load and display occupancy
            const occupancyResponse = await fetch(`${API_BASE_URL}/occupancy/${id}`);
            const occupancy = await occupancyResponse.json();
            
            occupancyInfo.innerHTML = `
                <div class="mt-3">
                    <h6>Current Occupancy</h6>
                    <div class="progress">
                        <div class="progress-bar ${occupancy.percentage > 80 ? 'bg-danger' : occupancy.percentage > 50 ? 'bg-warning' : 'bg-success'}" 
                             style="width: ${occupancy.percentage}%">
                            ${occupancy.current}/${occupancy.capacity}
                        </div>
                    </div>
                    <p class="mt-2 mb-0">${occupancy.percentage}% occupied</p>
                </div>
            `;
            
            featureInfo.style.display = 'block';
        }
    } else if (type === 'trail') {
        const response = await fetch(`${API_BASE_URL}/trails`);
        const trails = await response.json();
        const trail = trails.find(t => t.trail_id === id);
        
        if (trail) {
            featureTitle.innerHTML = `Selected: ${trail.name}`;
            featureDetails.innerHTML = `
                <p><strong>Distance:</strong> ${trail.distance_km} km</p>
                <p><strong>Difficulty:</strong> ${trail.difficulty_level}</p>
                <p><strong>Ready for check-in!</strong></p>
            `;
            occupancyInfo.innerHTML = '';
            featureInfo.style.display = 'block';
        }
    }
}

// Handle check-in form submission
async function handleCheckin(event) {
    event.preventDefault();
    
    const userName = document.getElementById('userName').value;
    const activityType = document.getElementById('activityType').value;
    const partySize = document.getElementById('partySize').value;
    const notes = document.getElementById('checkinNotes').value;
    
    if (!selectedFacility && !selectedTrail) {
        showMessage('checkinMessages', 'Please select a facility or trail from the map first.', 'error');
        return;
    }
    
    const checkinData = {
        user_name: userName,
        activity_type: activityType,
        party_size: parseInt(partySize),
        notes: notes,
        facility_id: selectedFacility,
        trail_id: selectedTrail,
        checkin_location: currentLocation ? 
            { type: 'Point', coordinates: [currentLocation[1], currentLocation[0]] } : null
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/checkins`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(checkinData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showMessage('checkinMessages', 'Check-in successful! Enjoy your activity!', 'success');
            document.getElementById('checkinForm').reset();
            
            // Reload facilities to update occupancy colors
            if (selectedFacility) {
                setTimeout(() => {
                    loadFacilities(document.getElementById('facilityFilter').value);
                    displaySelectedFeature('facility', selectedFacility);
                }, 500);
            }
            
            selectedFacility = null;
            selectedTrail = null;
            
        } else {
            showMessage('checkinMessages', result.error || 'Check-in failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting check-in:', error);
        showMessage('checkinMessages', 'Network error. Please try again.', 'error');
    }
}

// Filter amenities
function filterAmenities() {
    const filterValue = document.getElementById('amenityFilter').value;
    loadAmenities(filterValue);
}

// Find nearby amenities based on user location
async function findNearbyAmenities() {
    // First try to get user location if we don't have it
    if (!currentLocation) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    currentLocation = [position.coords.latitude, position.coords.longitude];
                    
                    // Add marker for user location
                    L.marker(currentLocation, {
                        icon: L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
                            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                        })
                    }).addTo(map).bindPopup('You are here!').openPopup();
                    
                    // Center map on user location
                    map.setView(currentLocation, 16);
                    
                    // Now find nearby amenities
                    await displayNearbyAmenities();
                },
                (error) => {
                    showMessage('checkinMessages', 'Please enable location services to find nearby amenities.', 'error');
                }
            );
        } else {
            showMessage('checkinMessages', 'Geolocation is not supported by your browser.', 'error');
        }
    } else {
        // We already have location, just find amenities
        await displayNearbyAmenities();
    }
}

// Display nearby amenities
async function displayNearbyAmenities() {
    try {
        const response = await fetch(`${API_BASE_URL}/amenities`);
        const amenities = await response.json();
        
        // Calculate distances from current location
        const amenitiesWithDistance = amenities.map(amenity => {
            const distance = calculateDistance(
                currentLocation[0], currentLocation[1],
                amenity.latitude, amenity.longitude
            );
            return { ...amenity, distance };
        });
        
        // Sort by distance and get top 3
        amenitiesWithDistance.sort((a, b) => a.distance - b.distance);
        const nearest = amenitiesWithDistance.slice(0, 3);
        
        // Display results
        const nearbyResults = document.getElementById('nearbyResults');
        const nearbyList = document.getElementById('nearbyList');
        
        let html = '';
        nearest.forEach((amenity, index) => {
            const icon = getAmenityIcon(amenity.amenity_type);
            html += `
                <div class="nearby-item">
                    <strong>${icon} ${amenity.name}</strong><br>
                    <small>Type: ${amenity.amenity_type.replace(/_/g, ' ')}</small><br>
                    <small>Distance: ${(amenity.distance * 1000).toFixed(0)} meters</small>
                </div>
            `;
        });
        
        nearbyList.innerHTML = html;
        nearbyResults.style.display = 'block';
        
        // Optionally zoom map to show user and nearest amenities
        const bounds = L.latLngBounds([currentLocation]);
        nearest.forEach(amenity => {
            bounds.extend([amenity.latitude, amenity.longitude]);
        });
        map.fitBounds(bounds, { padding: [50, 50] });
        
    } catch (error) {
        console.error('Error finding nearby amenities:', error);
        showMessage('checkinMessages', 'Error finding nearby amenities.', 'error');
    }
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI/180);
}

// Get amenity icon
function getAmenityIcon(type) {
    const icons = {
        'restroom': '🚻',
        'water_fountain': '💧',
        'parking': '🅿️',
        'first_aid': '🏥',
        'picnic_table': '🏕️',
        'bench': '🪑',
        'bike_rack': '🚲',
        'information_kiosk': 'ℹ️',
        'trash_bin': '🗑️'
    };
    return icons[type] || '📍';
}

// Load facility occupancy
async function loadOccupancy(facilityId) {
    try {
        const response = await fetch(`${API_BASE_URL}/occupancy/${facilityId}`);
        const occupancy = await response.json();
        
        const occupancyHtml = `
            <div class="mt-3">
                <h6>Current Occupancy</h6>
                <div class="progress">
                    <div class="progress-bar ${occupancy.percentage > 80 ? 'bg-danger' : occupancy.percentage > 50 ? 'bg-warning' : 'bg-success'}" 
                         style="width: ${occupancy.percentage}%">
                        ${occupancy.current}/${occupancy.capacity}
                    </div>
                </div>
                <p class="mt-2 mb-0">${occupancy.percentage}% occupied</p>
            </div>
        `;
        
        document.getElementById('occupancyInfo').innerHTML = occupancyHtml;
        
    } catch (error) {
        console.error('Error loading occupancy:', error);
    }
}

// Show message helper
function showMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.innerHTML = `<div class="${type === 'error' ? 'error-message' : 'success-message'}">${message}</div>`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageDiv.innerHTML = '';
    }, 5000);
}

// Initialize the application when page loads
window.onload = function() {
    initMap();
    
    // Refresh weather every 10 minutes
    setInterval(loadWeather, 600000);
    
    // Refresh facilities (and their occupancy) every 30 seconds
    setInterval(() => {
        const currentFilter = document.getElementById('facilityFilter').value;
        loadFacilities(currentFilter);
    }, 30000);
};