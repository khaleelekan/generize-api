const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow all origins
app.use(cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type']
}));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Genderize API Integration Service' });
});

// Main classification endpoint
app.get('/api/classify', async (req, res) => {
  try {
    const { name } = req.query;

    // Query parameter validation - 400 Bad Request
    if (name === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing name parameter'
      });
    }

    if (name.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Name parameter cannot be empty'
      });
    }

    // Type validation - 422 Unprocessable Entity
    if (typeof name !== 'string') {
      return res.status(422).json({
        status: 'error',
        message: 'Name must be a string'
      });
    }

    // Call Genderize API
    let response;
    try {
      response = await axios.get(`https://api.genderize.io`, {
        params: { name: name.trim() },
        timeout: 5000 // 5 second timeout
      });
    } catch (error) {
      console.error('Genderize API error:', error.message);
      
      if (error.response) {
        // Upstream API error
        return res.status(error.response.status >= 500 ? 502 : 500).json({
          status: 'error',
          message: 'Upstream service error'
        });
      } else if (error.request) {
        // Network error
        return res.status(502).json({
          status: 'error',
          message: 'Unable to reach upstream service'
        });
      } else {
        // Request setup error
        return res.status(500).json({
          status: 'error',
          message: 'Internal server error'
        });
      }
    }

    const { gender, probability, count } = response.data;

    // Genderize edge case: null gender or 0 count
    if (gender === null || count === 0) {
      return res.status(200).json({
        status: 'error',
        message: 'No prediction available for the provided name'
      });
    }

    // Process the response
    const sample_size = count;
    const is_confident = probability >= 0.7 && sample_size >= 100;
    const processed_at = new Date().toISOString();

    // Return success response
    res.status(200).json({
      status: 'success',
      data: {
        name: name.trim(),
        gender,
        probability,
        sample_size,
        is_confident,
        processed_at
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;