const axios = require('axios');

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

module.exports = async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  // Set CORS headers for all responses
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

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
        timeout: 5000
      });
    } catch (error) {
      console.error('Genderize API error:', error.message);
      
      if (error.response) {
        return res.status(error.response.status >= 500 ? 502 : 500).json({
          status: 'error',
          message: 'Upstream service error'
        });
      } else if (error.request) {
        return res.status(502).json({
          status: 'error',
          message: 'Unable to reach upstream service'
        });
      } else {
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
};