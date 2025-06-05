// api/index.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Environment variables validation
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
  process.exit(1);
}

// Cache for the OpenAPI spec
let cachedSpec = null;
let cacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Function to fetch and enhance the OpenAPI spec
async function fetchAndEnhanceSpec() {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`);
    
    if (!response.ok) {
      throw new Error(`Supabase API returned ${response.status}: ${response.statusText}`);
    }
    
    const spec = await response.json();
    
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

// Enhanced health check endpoint
app.get('/health', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const supabaseCheck = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': SUPABASE_ANON_KEY }
    });
    
    res.json({
      status: 'healthy',
      service: 'Pica Loco API Documentation',
      timestamp: new Date().toISOString(),
      supabase: supabaseCheck.ok ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      service: 'Pica Loco API Documentation',
      timestamp: new Date().toISOString(),
      error: 'Cannot connect to Supabase'
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
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Initialize Swagger UI with a placeholder spec first
async function initializeSwaggerUI() {
  try {
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
    
    console.log('Swagger UI initialized successfully');
    
  } catch (error) {
    console.error('Failed to initialize Swagger UI:', error);
    
    // Fallback: setup with a basic error spec
    const errorSpec = {
      openapi: '3.0.0',
      info: {
        title: 'Pica Loco API - Error',
        version: '1.0.0',
        description: 'Unable to load API specification from Supabase'
      },
      paths: {}
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
  });
}