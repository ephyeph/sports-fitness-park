// sports-park.js - Main application JavaScript

// Global variables
let map;
let currentLocation = null;
let selectedFacility = null;
let selectedTrail = null;
let facilitiesLayer, trailsLayer, amenitiesLayer;

const API_BASE_URL = 'http://localhost:3000/api';

// Initialize map
function initMap() {
    // Center on Mooresville, Indiana area (approximate park location)
    map = L.map('map').setView([40.1164, -85.7585], 16);
    
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

// Load facilities from API
async function loadFacilities(type = '') {
    try {
        const url = type ? `${API_BASE_URL}/facilities?type=${type}` : `${API_BASE_URL}/facilities`;
        const response = await fetch(url);
        const facilities = await response.json();
        
        facilitiesLayer.clearLayers();
        
        facilities.forEach(facility => {
            const marker = L.circleMarker([facility.latitude, facility.longitude], {
                color: '#28a745',
                fillColor: '#28a745',
                fillOpacity: 0.8,
                radius: 8,
                weight: 2
            }).addTo(facilitiesLayer);
            
            const popupContent = `
                <div>
                    <h6>${facility.name}</h6>
                    <p><strong>Type:</strong> ${facility.facility_type.replace(/_/g, ' ')}</p>
                    <p><strong>Capacity:</strong> ${facility.capacity} people</p>
                    <p><strong>Surface:</strong> ${facility.surface_type}</p>
                    <p><strong>Lighting:</strong> ${facility.has_lighting ? 'Yes' : 'No'}</p>
                    <p><strong>Accessible:</strong> ${facility.accessible ? 'Yes' : 'No'}</p>
                    <button class="btn btn-sm btn-park" onclick="selectFacility(${facility.facility_id})">
                        Select for Check-in
                    </button>
                </div>
            `;
            
            marker.bindPopup(popupContent);
        });
        
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
            
            const polyline = L.polyline(coords, {
                color: '#007bff',
                weight: 4,
                opacity: 0.8
            }).addTo(trailsLayer);
            
            const popupContent = `
                <div>
                    <h6>${trail.name}</h6>
                    <p><strong>Type:</strong> ${trail.trail_type.replace(/_/g, ' ')}</p>
                    <p><strong>Distance:</strong> ${trail.distance_km} km</p>
                    <p><strong>Difficulty:</strong> ${trail.difficulty_level}</p>
                    <p><strong>Elevation Gain:</strong> ${trail.elevation_gain}m</p>
                    <p><strong>Surface:</strong> ${trail.surface_type}</p>
                    <button class="btn btn-sm btn-park" onclick="selectTrail(${trail.trail_id})">
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

// Load amenities from API
async function loadAmenities() {
    try {
        const response = await fetch(`${API_BASE_URL}/amenities`);
        const amenities = await response.json();
        
        amenitiesLayer.clearLayers();
        
        amenities.forEach(amenity => {
            const marker = L.circleMarker([amenity.latitude, amenity.longitude], {
                color: '#ffc107',
                fillColor: '#ffc107',
                fillOpacity: 0.8,
                radius: 6,
                weight: 2
            }).addTo(amenitiesLayer);
            
            const popupContent = `
                <div>
                    <h6>${amenity.amenity_type.replace(/_/g, ' ')}</h6>
                    <p><strong>Accessible:</strong> ${amenity.accessible ? 'Yes' : 'No'}</p>
                    ${amenity.operating_hours ? `<p><strong>Hours:</strong> ${amenity.operating_hours}</p>` : ''}
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
}

// Select trail for check-in
function selectTrail(trailId) {
    selectedTrail = trailId;
    selectedFacility = null;
    document.getElementById('activityType').focus();
    showMessage('checkinMessages', 'Trail selected! Please complete the check-in form.', 'success');
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
            selectedFacility = null;
            selectedTrail = null;
            
            // Reload occupancy data
            if (selectedFacility) {
                loadOccupancy(selectedFacility);
            }
        } else {
            showMessage('checkinMessages', result.error || 'Check-in failed. Please try again.', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting check-in:', error);
        showMessage('checkinMessages', 'Network error. Please try again.', 'error');
    }
}

// Get activity recommendations
async function getRecommendations() {
    try {
        const response = await fetch(`${API_BASE_URL}/recommendations`);
        const recommendations = await response.json();
        
        let message = '<h6>Today\'s Recommendations:</h6><ul>';
        recommendations.forEach(rec => {
            message += `<li><strong>${rec.name}</strong> - ${rec.reason}</li>`;
        });
        message += '</ul>';
        
        document.getElementById('featureTitle').innerHTML = 'Activity Recommendations';
        document.getElementById('featureDetails').innerHTML = message;
        document.getElementById('occupancyInfo').innerHTML = '';
        document.getElementById('featureInfo').style.display = 'block';
        
    } catch (error) {
        console.error('Error getting recommendations:', error);
        showMessage('checkinMessages', 'Unable to get recommendations at this time.', 'error');
    }
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
    
    // Refresh occupancy data every minute
    setInterval(() => {
        if (selectedFacility) {
            loadOccupancy(selectedFacility);
        }
    }, 60000);
};