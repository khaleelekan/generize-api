// No PORT, no app.listen(), no express needed
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { name } = req.query;

  // Validation
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

  if (typeof name !== 'string') {
    return res.status(422).json({
      status: 'error',
      message: 'Name must be a string'
    });
  }

  try {
    const response = await fetch(`https://api.genderize.io?name=${encodeURIComponent(name.trim())}`);
    const data = await response.json();
    
    const { gender, probability, count } = data;

    if (gender === null || count === 0) {
      return res.status(200).json({
        status: 'error',
        message: 'No prediction available for the provided name'
      });
    }

    const sample_size = count;
    const is_confident = probability >= 0.7 && sample_size >= 100;
    const processed_at = new Date().toISOString();

    return res.status(200).json({
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
    console.error('API Error:', error.message);
    return res.status(502).json({
      status: 'error',
      message: 'Unable to reach upstream service'
    });
  }
}