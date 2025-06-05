// api/index.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Environment variables validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

console.log('Environment check:');
console.log('SUPABASE_URL:', SUPABASE_URL ? 'Set' : 'Missing');
console.log('SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'Set (length: ' + SUPABASE_ANON_KEY.length + ')' : 'Missing');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

// Cache for the OpenAPI spec
let cachedSpec = null;
let cacheTime = null;
let initError = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch and enhance the OpenAPI spec
async function fetchAndEnhanceSpec() {
  try {
    console.log('Fetching spec from:', `${SUPABASE_URL}/rest/v1/?apikey=***`);
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`);
    
    console.log('Supabase response status:', response.status);
    console.log('Supabase response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase error response:', errorText);
      throw new Error(`Supabase API returned ${response.status}: ${response.statusText} - ${errorText}`);
    }
    
    const spec = await response.json();
    console.log('Spec received, info:', spec.info);
    console.log('Spec paths count:', Object.keys(spec.paths || {}).length);
    
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
    initError: initError ? initError.message : null,
    timestamp: new Date().toISOString()
  });
});

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const supabaseCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    
    const supabaseStatus = supabaseCheck.ok ? 'connected' : 'disconnected';
    
    res.json({
      status: 'healthy',
      service: 'Pica Loco API Documentation',
      timestamp: new Date().toISOString(),
      supabase: supabaseStatus,
      supabaseUrl: SUPABASE_URL,
      hasSpec: !!cachedSpec,
      initError: initError ? initError.message : null
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

// Initialize Swagger UI with better error handling
async function initializeSwaggerUI() {
  try {
    console.log('Starting Swagger UI initialization...');
    
    // Fetch the initial spec
    const spec = await fetchAndEnhanceSpec();
    
    // Cache it
    cachedSpec = spec;
    cacheTime = Date.now();
    
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
          request.headers['apikey'] = SUPABASE_ANON_KEY;
          request.headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
          return request;
        }
      }
    };
    
    // Setup Swagger UI with the fetched spec
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec, swaggerUiOptions));
    
    console.log('Swagger UI initialized successfully with', Object.keys(spec.paths || {}).length, 'paths');
    
  } catch (error) {
    console.error('Failed to initialize Swagger UI:', error);
    initError = error;
    
    // Fallback: setup with a diagnostic error spec
    const errorSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Pica Loco API - Initialization Error',
        version: '1.0.0',
        description: `Unable to load API specification from Supabase. Error: ${error.message}`
      },
      paths: {
        '/debug': {
          get: {
            summary: 'Check debug information',
            description: 'Visit /debug endpoint to see detailed error information',
            responses: {
              '200': {
                description: 'Debug information'
              }
            }
          }
        }
      }
    };
    
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(errorSpec, {
      customSiteTitle: "Pica Loco API Documentation - Error"
    }));
  }
}

// Initialize Swagger UI when the module loads
initializeSwaggerUI();

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