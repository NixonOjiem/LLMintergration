require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();



// const isHtmlResponse = (data) => {
//   return data.trim().startsWith('<!DOCTYPE html>') || 
//          data.includes('<html>') || 
//          data.includes('Cloudflare');
// };

// const analyzeResponse = (data) => {
//   const isHtml = data.startsWith('<!DOCTYPE html>') || data.includes('<html>');
//   return {
//     isHtml,
//     isJson: !isHtml && (data.trim().startsWith('{') || data.trim().startsWith('[')),
//     data: data.substring(0, 1000)
//   };
// };

// const checkConnectivity = async () => {
//   try {
//     await axios.head('https://deepseek-v3-api.p.rapidapi.com');
//     console.log('API endpoint reachable');
//   } catch (error) {
//     console.error('Connectivity error:', error.message);
//   }
// };

// checkConnectivity();

// const parseJsonSafely = (data) => {
//   try {
//     return JSON.parse(data);
//   } catch (e) {
//     console.error('Raw API Response (first 500 chars):', data.substring(0, 500));
//     return { _parseError: true, message: `JSON Parse Error: ${e.message}` };
//   }
// };

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

// Middleware pipeline
app.use(cors(corsOptions));
app.use(express.json());

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON format' });
  }
  next();
});

console.log('Environment Variables:', {
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? '***' : 'MISSING',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***' : 'MISSING',
  GEMINI_ENDPOINT: process.env.GEMINI_ENDPOINT
});

// Gemini Configuration
const GEMINI_CONFIG = {
  endpoint: process.env.GEMINI_ENDPOINT || 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': process.env.GEMINI_API_KEY
  },
  parameters: {
    temperature: 0.7,
    maxOutputTokens: 1000,
    topP: 1,
    topK: 40
  },
  timeout: 15000
};

const LLM_INTEGRATION = {
  deepseek: {
    endpoint: 'https://deepseek-v3-api.p.rapidapi.com/v1/chat/completions',
    headers: {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'deepseek-v3-api.p.rapidapi.com',
      'Content-Type': 'application/json'
    },
    parameters: { // Add required parameters
      model: 'deepseek-v3',
      temperature: 0.7,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    },
    timeout: 15000
  }
};

async function safeJsonParse(response) {
  const contentType = response.headers['content-type'] || '';
  const analysis = analyzeResponse(response.data);

  return {
    data: analysis.type === 'html' ? { 
      _gatewayError: true,
      content: analysis.content
    } : contentType.includes('application/json') ? 
      parseJsonSafely(response.data) : {
        _nonJsonResponse: true,
        content: analysis.content
      },
    status: response.status,
    headers: response.headers
  };
}

app.post('/api/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query?.trim()) {
      return res.status(400).json({ 
        error: 'Invalid Request',
        details: 'Query cannot be empty'
      });
    }

    const response = await axios.post(
      GEMINI_CONFIG.endpoint,
      {
        contents: [{
          parts: [{
            text: query.trim()
          }]
        }],
        generationConfig: GEMINI_CONFIG.parameters,
        safetySettings: [ // Add recommended safety settings
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_ONLY_HIGH"
          }
        ],
      },
      {
        headers: GEMINI_CONFIG.headers,
        timeout: GEMINI_CONFIG.timeout
      }
    );

    const responseData = response.data;
    
    // Validate Gemini response structure
    if (!responseData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini Response:', responseData);
      throw new Error('Unexpected response format from Gemini');
    }

    res.json({
      answer: responseData.candidates[0].content.parts[0].text,
      safetyRatings: responseData.candidates[0].safetyRatings,
      usageMetadata: responseData.usageMetadata
    });

  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || error.message;
    
    console.error('API Error:', {
      error: errorMessage,
      stack: error.stack,
      status: statusCode
    });

    res.status(statusCode).json({
      error: 'API Request Failed',
      details: errorMessage,
      ...(statusCode === 401 && {
        solution: 'Check your GEMINI_API_KEY in .env file'
      })
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));