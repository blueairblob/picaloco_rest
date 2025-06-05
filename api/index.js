// api/index.js - Fixed Synchronous Version
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Environment variables validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set (length: ' + SUPABASE_ANON_KEY.length + ')' : 'Missing');

// Create a basic fallback spec
const fallbackSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Pica Loco API',
    version: '1.0.0',
    description: 'API documentation is loading from Supabase...'
  },
  servers: SUPABASE_URL ? [
    {
      url: SUPABASE_URL + '/rest/v1',
      description: 'Pica Loco API Server'
    }
  ] : [],
  paths: {
    '/health': {
      get: {
        summary: 'Health Check',
        description: 'Check if the API documentation service is running',
        responses: {
          '200': {
            description: 'Service is healthy'
          }
        }
      }
    }
  }
};

// Cache for the OpenAPI spec
let cachedSpec = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch and enhance the OpenAPI spec
async function fetchAndEnhanceSpec() {
  try {
    console.log('Fetching spec from:', `${SUPABASE_URL}/rest/v1/?apikey=***`);
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`);
    
    console.log('Supabase response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error response:', errorText);
      throw new Error(`Supabase API returned ${response.status}: ${response.statusText}`);
    }
    
    const spec = await response.json();
    console.log('Spec received, paths count:', Object.keys(spec.paths || {}).length);
    
    // Enhance the spec with custom metadata
    spec.info = {
      ...spec.info,
      title: "Pica Loco API",
      description: "Auto-generated API documentation for the Pica Loco mobile app backend",
      version: "1.0.0",
      contact: {
        name: "Pica Loco Development Team",
        url: "https://github.com/your-username/trainpixelfolio"
      }
    };
    
    // Ensure the spec has the correct host/server info for testing
    spec.servers = [
      {
        url: SUPABASE_URL + '/rest/v1',
        description: 'Pica Loco API Server'
      }
    ];
    
    console.log('Spec enhanced successfully');
    return spec;
  } catch (error) {
    console.error('Failed to fetch OpenAPI spec:', error);
    throw error;
  }
}

// Middleware for basic logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Debug endpoint to show environment and status
app.get('/debug', (req, res) => {
  res.json({
    environment: {
      SUPABASE_URL: SUPABASE_URL ? 'Set' : 'Missing',
      SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      NODE_ENV: process.env.NODE_ENV || 'not set'
    },
    cache: {
      hasCachedSpec: !!cachedSpec,
      cacheTime: cacheTime ? new Date(cacheTime).toISOString() : null
    },
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(503).json({
        status: 'unhealthy',
        service: 'Pica Loco API Documentation',
        error: 'Missing environment variables',
        timestamp: new Date().toISOString()
      });
    }

    const fetch = (await import('node-fetch')).default;
    const supabaseCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    
    const supabaseStatus = supabaseCheck.ok ? 'connected' : 'disconnected';
    
    res.json({
      status: supabaseStatus === 'connected' ? 'healthy' : 'degraded',
      service: 'Pica Loco API Documentation',
      timestamp: new Date().toISOString(),
      supabase: supabaseStatus,
      supabaseUrl: SUPABASE_URL,
      hasSpec: !!cachedSpec
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'Pica Loco API Documentation',
      timestamp: new Date().toISOString(),
      error: error.message,
      supabaseUrl: SUPABASE_URL
    });
  }
});

// Enhanced API spec endpoint with caching
app.get('/api/spec', async (req, res) => {
  try {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ 
        error: 'Missing environment variables',
        details: 'SUPABASE_URL and SUPABASE_ANON_KEY must be set'
      });
    }

    // Check cache first
    if (cachedSpec && cacheTime && Date.now() - cacheTime < CACHE_DURATION) {
      return res.json(cachedSpec);
    }
    
    // Fetch fresh spec
    const spec = await fetchAndEnhanceSpec();
    
    // Update cache
    cachedSpec = spec;
    cacheTime = Date.now();
    
    res.json(spec);
  } catch (error) {
    console.error('API spec fetch error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch OpenAPI specification',
      details: error.message,
      supabaseUrl: SUPABASE_URL
    });
  }
});

// Custom Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { 
      color: #3ECF8E; 
      font-family: 'Inter', sans-serif;
    }
    .swagger-ui .scheme-container { 
      background: #1a1a1a; 
      border: 1px solid #3ECF8E;
    }
  `,
  customSiteTitle: "Pica Loco API Documentation",
  swaggerOptions: {
    requestInterceptor: (request) => {
      // Add required headers for Supabase API calls
      if (SUPABASE_ANON_KEY) {
        request.headers['apikey'] = SUPABASE_ANON_KEY;
        request.headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
      }
      return request;
    }
  }
};

// Setup Swagger UI synchronously with fallback spec
console.log('Setting up Swagger UI with fallback spec...');
app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(fallbackSpec, swaggerUiOptions));

// Background task to fetch real spec and update
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  fetchAndEnhanceSpec()
    .then(spec => {
      console.log('Real spec fetched, updating cache');
      cachedSpec = spec;
      cacheTime = Date.now();
      
      // Update the Swagger UI with the real spec
      app.get('/docs', swaggerUi.setup(spec, swaggerUiOptions));
      console.log('Swagger UI updated with real spec containing', Object.keys(spec.paths || {}).length, 'paths');
    })
    .catch(error => {
      console.error('Failed to fetch real spec:', error);
    });
} else {
  console.log('Environment variables missing, using fallback spec only');
}

// Export for Vercel
module.exports = app;

// For local development
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Pica Loco API Documentation running on port ${port}`);
    console.log(`Visit: http://localhost:${port}/docs`);
    console.log(`Debug info: http://localhost:${port}/debug`);
  });
}