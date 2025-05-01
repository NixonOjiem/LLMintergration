const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

const app = express();
app.use(cors(corsOptions));
app.use(express.json());

const LLM_INTEGRATION = {
  deepseek: {
    endpoint: process.env.DEEPSEEK_ENDPOINT,
    auth: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    model: 'deepseek-chat' // Update with correct model name
  },
  gemini: {
    endpoint: process.env.GEMINI_ENDPOINT,
    auth: `Bearer ${process.env.GEMINI_API_KEY}`
  },
  copilot: {
    endpoint: process.env.GEMINI_ENDPOINT,
    auth: `Bearer ${process.env.GEMINI_API_KEY}`
  }
};

app.post('/api/query', async (req, res) => {
  try {
    const { query, service } = req.body;
    console.log('Incoming request:', { service, query }); // Add logging

    if (!['deepseek', 'gemini'].includes(service)) {
      throw new Error(`Invalid service: ${service}`);
    }

    const config = LLM_INTEGRATION[service];

    if (service === 'deepseek') {
      const response = await axios.post(
        config.endpoint,
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: query }],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': config.auth,
            'Content-Type': 'application/json'
          }
        }
      );

      return res.json({
        answer: response.data.choices[0].message.content
      });
    }

    // Keep Gemini implementation here

  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({ 
      error: error.message,
      stack: error.stack // Remove in production
    });
  }
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));