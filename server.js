const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const  LLM_INTERGRATION = {
  deepseek: {
    endpoint: process.env.DEEPSEEK_ENDPOINT,
    auth: `Bearer ${process.env.DEEPSEEK_API_KEY}`
  },
  gemini: {
    endpoint: process.env.GEMINI_ENDPOINT,
    auth: `Bearer ${process.env.GEMINI_API_KEY}`
  },
  copilot: {
    endpoint: process.env.COPILOT_ENDPOINT,
    auth: `Bearer ${process.env.COPILOT_API_KEY}`
  }
};

app.post('/api/query', async (req, res) => {
  try {
    const { query, service } = req.body;
    const config = LLM_INTERGRATION[service];

    const response = await axios.post(config.endpoint, {
      prompt: query,
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': config.auth,
        'Content-Type': 'application/json'
      }
    });

    res.json({ answer: response.data.choices[0].text });
  } catch (error) {
    console.error('LLM Error:', error);
    res.status(500).json({ error: 'Failed to process query' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));