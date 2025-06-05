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
    
    return spec;
  } catch (error) {
    console.error('Failed to fetch OpenAPI spec:', error);
    throw error;
  }
}

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
    // Remove the custom URL - we'll serve the spec ourselves
    requestInterceptor: (request) => {
      // Add required headers for Supabase API calls
      request.headers['apikey'] = SUPABASE_ANON_KEY;
      request.headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
      return request;
    }
  }
};

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

// Setup Swagger UI with proper static asset serving
app.use('/docs', swaggerUi.serve);

// Create the docs endpoint that loads our custom spec
app.get('/docs', async (req, res) => {
  try {
    // Fetch the spec dynamically
    const spec = await fetchAndEnhanceSpec();
    
    // Generate the Swagger UI HTML with our spec
    const html = swaggerUi.generateHTML(spec, swaggerUiOptions);
    res.send(html);
  } catch (error) {
    console.error('Error generating Swagger UI:', error);
    res.status(500).send(`
      <html>
        <head><title>Pica Loco API Documentation - Error</title></head>
        <body>
          <h1>Error Loading API Documentation</h1>
          <p>Unable to fetch the API specification from Supabase.</p>
          <p>Error: ${error.message}</p>
          <p><a href="/health">Check service health</a></p>
        </body>
      </html>
    `);
  }
});

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