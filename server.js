require('dotenv').config({ path: '.env' });
const express = require('express');
const cors = require('cors');
const axios = require('axios');


const isHtmlResponse = (data) => {
  return data.trim().startsWith('<!DOCTYPE html>') || 
         data.includes('<html>') || 
         data.includes('Cloudflare');
};

const analyzeResponse = (data) => {
  const isHtml = data.startsWith('<!DOCTYPE html>') || data.includes('<html>');
  return {
    isHtml,
    isJson: !isHtml && (data.trim().startsWith('{') || data.trim().startsWith('[')),
    data: data.substring(0, 1000)
  };
};

const checkConnectivity = async () => {
  try {
    await axios.head('https://deepseek-v3-api.p.rapidapi.com');
    console.log('API endpoint reachable');
  } catch (error) {
    console.error('Connectivity error:', error.message);
  }
};

checkConnectivity();

const parseJsonSafely = (data) => {
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error('Raw API Response (first 500 chars):', data.substring(0, 500));
    return { _parseError: true, message: `JSON Parse Error: ${e.message}` };
  }
};

const corsOptions = {
  origin: 'http://localhost:3000',
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
};

const app = express();

// Middleware pipeline
app.use(cors(corsOptions));
app.use(express.json({
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));
app.use((req, res, next) => {
  const contentType = req.headers['content-type'];
  if (!contentType || !contentType.includes('application/json')) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      details: `Expected JSON but received ${contentType || 'undefined'}`
    });
  }
  next();
});

console.log('Environment Variables:', {
  RAPIDAPI_KEY: process.env.RAPIDAPI_KEY ? '***' : 'MISSING',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '***' : 'MISSING',
  GEMINI_ENDPOINT: process.env.GEMINI_ENDPOINT
});

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
    const { query, service = 'deepseek' } = req.body;

    // Validate request
    if (!query?.trim()) {
      return res.status(400).json({ 
        error: 'Query cannot be empty',
        details: 'Please provide a valid question or prompt'
      });
    }

    // Service configuration check
    const config = LLM_INTEGRATION[service];
    if (!config) {
      return res.status(400).json({
        error: 'Unsupported service',
        availableServices: Object.keys(LLM_INTEGRATION)
      });
    }

    // API Request execution
    let apiResponse;
    try {
      apiResponse = await axios.post(config.endpoint, {
        messages: [

          { role: 'user', content: query.trim() },
        ],
        model: config.model,
        temperature: 0.7,
        max_tokens: 1000
      }, {
        headers: config.headers,
        timeout: config.timeout,
        responseType: 'text', // Get raw response
        validateStatus: (status) => status < 500 // Handle 5xx errors specially
      });
    } catch (axiosError) {
      console.error('API Connection Error:', {
        code: axiosError.code,
        message: axiosError.message,
        config: axiosError.config
      });
      throw new Error(`Service unavailable: ${axiosError.message}`);
    }

    // Response analysis
    const responseAnalysis = {
      status: apiResponse.status,
      headers: apiResponse.headers,
      contentType: apiResponse.headers['content-type'],
      bodyLength: apiResponse.data?.length || 0
    };

    // Handle HTML responses (common in 502 errors)
    if (apiResponse.data.startsWith('<!DOCTYPE html>')) {
      console.error('HTML Response Received:', apiResponse.data.substring(0, 500));
      throw new Error('API provider returned an HTML error page');
    }

    // Parse response
    let responseData;
    try {
      responseData = JSON.parse(apiResponse.data);
    } catch (parseError) {
      console.error('JSON Parse Failure:', {
        rawResponse: apiResponse.data.substring(0, 500),
        status: apiResponse.status
      });
      throw new Error(`Invalid API response format: ${parseError.message}`);
    }

    // Validate DeepSeek response structure
    if (service === 'deepseek') {
      if (!responseData.choices?.[0]?.message?.content) {
        console.error('Invalid DeepSeek Structure:', responseData);
        throw new Error('API returned unexpected response format');
      }
    }

    // Success response
    return res.json({
      answer: responseData.choices[0].message.content,
      usage: {
        prompt_tokens: responseData.usage?.prompt_tokens,
        completion_tokens: responseData.usage?.completion_tokens
      }
    });

  } catch (error) {
    // Error classification
    const isGatewayError = error.message.includes('HTML error page');
    const statusCode = isGatewayError ? 502 : error.response?.status || 500;

    // Client-friendly error messages
    const errorResponse = {
      error: isGatewayError 
        ? 'Service temporarily unavailable' 
        : error.message,
      details: {
        service,
        suggestion: isGatewayError ? [
          'Check API provider status',
          'Verify your API subscription',
          'Try again in a few minutes'
        ] : undefined
      }
    };

    // Detailed server logging
    console.error('API Request Failure:', {
      timestamp: new Date().toISOString(),
      service,
      query: req.body.query,
      error: error.message,
      stack: error.stack,
      statusCode,
      rapidApiKey: process.env.RAPIDAPI_KEY ? '***' : 'MISSING'
    });

    return res.status(statusCode).json(errorResponse);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));