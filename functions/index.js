const functions = require('firebase-functions');
const axios = require('axios');

// City coordinates database
const cityCoordinates = {
    'madrid': { lat: 40.4168, lon: -3.7038 },
    'barcelona': { lat: 41.3851, lon: 2.1734 },
    'valencia': { lat: 39.4699, lon: -0.3763 },
    'bilbao': { lat: 43.2627, lon: -2.9355 },
    'sevilla': { lat: 37.3891, lon: -5.9845 },
    'paris': { lat: 48.8566, lon: 2.3522 },
    'london': { lat: 51.5074, lon: -0.1278 },
    'berlin': { lat: 52.5200, lon: 13.4050 },
    'amsterdam': { lat: 52.3676, lon: 4.9041 },
    'rome': { lat: 41.9028, lon: 12.4964 },
    'newyork': { lat: 40.7128, lon: -74.0060 },
    'losangeles': { lat: 34.0522, lon: -118.2437 },
    'chicago': { lat: 41.8781, lon: -87.6298 },
    'tokyo': { lat: 35.6762, lon: 139.6503 },
    'kyiv': { lat: 50.45466, lon: 30.5238 },
    'kiev': { lat: 50.45466, lon: 30.5238 },
    'sydney': { lat: -33.8688, lon: 151.2093 },
    'toronto': { lat: 43.6532, lon: -79.3832 },
    'mexico': { lat: 19.4326, lon: -99.1332 },
    'dubai': { lat: 25.2048, lon: 55.2708 },
    'singapour': { lat: 1.3521, lon: 103.8198 },
};

// Weather code to description mapping
const weatherCodes = {
    0: 'Ясно ☀️ / Despejado ☀️',
    1: 'Облачно ☁️ / Nublado ☁️',
    2: 'Облачно ☁️ / Nublado ☁️',
    3: 'Облачно ☁️ / Nublado ☁️',
    45: 'Туман 🌫️ / Niebla 🌫️',
    48: 'Туман 🌫️ / Niebla 🌫️',
    51: 'Дождь 🌧️ / Lluvia 🌧️',
    53: 'Дождь 🌧️ / Lluvia 🌧️',
    55: 'Дождь 🌧️ / Lluvia 🌧️',
    61: 'Дождь 🌧️ / Lluvia 🌧️',
    63: 'Дождь 🌧️ / Lluvia 🌧️',
    65: 'Дождь 🌧️ / Lluvia 🌧️',
    71: 'Снег 🌨️ / Nieve 🌨️',
    73: 'Снег 🌨️ / Nieve 🌨️',
    75: 'Снег 🌨️ / Nieve 🌨️',
    80: 'Ливни 🌧️ / Aguaceros 🌧️',
    81: 'Ливни 🌧️ / Aguaceros 🌧️',
    82: 'Ливни 🌧️ / Aguaceros 🌧️',
    95: 'Гроза ⛈️ / Tormenta ⛈️',
    96: 'Гроза ⛈️ / Tormenta ⛈️',
    99: 'Гроза ⛈️ / Tormenta ⛈️',
};

// Main webhook function
exports.weatherWebhook = functions.https.onRequest(async (req, res) => {
    try {
        // Only accept POST requests
        if (req.method !== 'POST') {
            return res.status(400).send('Only POST requests allowed');
        }

        // Get data from Dialogflow
        const requestBody = req.body;
        console.log('Received request:', JSON.stringify(requestBody, null, 2));

        // Extract the city parameter
        const city = requestBody?.queryResult?.parameters?.city;

        if (!city) {
            return res.json({
                fulfillmentText: 'No entendí la ciudad. ¿En qué ciudad quieres saber el tiempo?'
            });
        }

        // Normalize city name (lowercase, remove accents)
        const normalizedCity = city.toLowerCase().replace(/á|é|í|ó|ú/g, function(char) {
            const map = { 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' };
            return map[char] || char;
        });

        // Find coordinates
        const coords = cityCoordinates[normalizedCity];

        if (!coords) {
            return res.json({
                fulfillmentText: `Lo siento, no tengo datos para ${city}. Intenta con: Madrid, Barcelona, París, Londres, Nueva York, Tokio...`
            });
        }

        // Call Open-Meteo API
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m&current=weather_code&current=wind_speed_10m&current=relative_humidity_2m&temperature_unit=celsius`;


        const response = await axios.get(apiUrl);
        const weatherData = response.data.current;

        // Get weather description
        const weatherDesc = weatherCodes[weatherData.weather_code] || 'Desconocido';

        // Format response
        const temperature = weatherData.temperature_2m;
        const windSpeed = weatherData.wind_speed_10m.toFixed(1);
        const humidity = weatherData.relative_humidity_2m;

        const fulfillmentText = `En ${city}:
🌡️ Temperatura: ${temperature}°C
${weatherDesc}
💨 Viento: ${windSpeed} km/h
💧 Humedad: ${humidity}%`;

        console.log('Weather data found:', fulfillmentText);

        // Send response back to Dialogflow
        return res.json({
            fulfillmentText: fulfillmentText
        });

    } catch (error) {
        console.error('Error:', error.message);
        return res.json({
            fulfillmentText: 'Error al obtener el clima. Intenta de nuevo más tarde.'
        });
    }
});