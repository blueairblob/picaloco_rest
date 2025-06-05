// api/index.js
const express = require('express');
const swaggerUi = require('swagger-ui-express');

const app = express();

// Environment variables for your Supabase project
const SUPABASE_URL = process.env.SUPABASE_URL; // https://your-project.supabase.co
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

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
    url: `${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`,
    requestInterceptor: (request) => {
      // Add required headers for Supabase API calls
      request.headers['apikey'] = SUPABASE_ANON_KEY;
      request.headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
      return request;
    }
  }
};

// Root redirect to docs
app.get('/', (req, res) => {
  res.redirect('/docs');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Pica Loco API Documentation',
    timestamp: new Date().toISOString()
  });
});

// Setup Swagger UI
app.use('/docs', swaggerUi.serve);
app.get('/docs', swaggerUi.setup(null, swaggerUiOptions));

// Alternative endpoint for direct spec access
app.get('/api/spec', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`${SUPABASE_URL}/rest/v1/?apikey=${SUPABASE_ANON_KEY}`);
    const spec = await response.json();
    
    // Enhance the spec with additional metadata
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
    
    res.json(spec);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch OpenAPI specification' });
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