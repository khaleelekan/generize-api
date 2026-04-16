const express = require('express');
const cors = require('cors');
const classifyHandler = require('./api/classify');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));

app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Genderize API Integration Service',
    endpoint: '/api/classify?name={name}'
  });
});

app.get('/api/classify', classifyHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test at: http://localhost:${PORT}/api/classify?name=john`);
});