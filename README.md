# Pica Loco API Documentation

A beautifully styled Swagger UI documentation site for the Pica Loco mobile app's Supabase API, hosted on Vercel.

## 🚀 Live Demo

Visit your deployed documentation at: `https://your-vercel-app.vercel.app/docs`

## 📋 Overview

This project automatically generates and hosts interactive API documentation for your Supabase backend. It pulls the OpenAPI specification directly from your Supabase project and presents it through a customized Swagger UI interface.

### Features

- 🔄 **Auto-sync**: Documentation updates automatically when you modify your Supabase schema
- 🎨 **Custom Styling**: Branded with Pica Loco colors and design
- 🧪 **Interactive Testing**: Test API endpoints directly from the documentation
- 🔐 **Secure**: Environment variables keep your API keys safe
- ⚡ **Fast**: Deployed on Vercel's edge network
- 📱 **Responsive**: Works perfectly on desktop and mobile

## 🛠️ Setup & Deployment

### Prerequisites

- Node.js 18.x or higher
- A Supabase project
- A Vercel account
- Git repository (GitHub, GitLab, or Bitbucket)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/picaloco-api-docs.git
   cd picaloco-api-docs
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000/docs` to view your documentation.

### Deploy to Vercel

#### Option 1: Deploy via Vercel Dashboard

1. Push your code to a Git repository
2. Visit [vercel.com](https://vercel.com) and create a new project
3. Import your repository
4. Add environment variables in Project Settings:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key
5. Deploy!

#### Option 2: Deploy via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel --prod
```

## 📁 Project Structure

```
picaloco-api-docs/
├── api/
│   └── index.js           # Main Express server with Swagger UI setup
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment configuration
├── .gitignore            # Git ignore rules
├── .env.local            # Environment variables (not committed)
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | `https://abc123.supabase.co` |
| `SUPABASE_ANON_KEY` | Your Supabase anonymous/public key | `eyJ0eXAiOiJKV1Q...` |

### Customization

The Swagger UI is customized with Pica Loco branding in `api/index.js`. You can modify:

- **Colors**: Update the CSS in `customCss`
- **Title**: Change `customSiteTitle`
- **API Info**: Modify the spec enhancement in `/api/spec` endpoint

## 🛡️ Security Notes

- Only use your `anon` key for public documentation
- Never commit your `.env.local` file
- Your `service_role` key should never be used in client-side applications
- Consider implementing rate limiting for production use

## 📚 API Endpoints

- `/` - Redirects to documentation
- `/docs` - Interactive Swagger UI documentation
- `/health` - Health check endpoint
- `/api/spec` - Enhanced OpenAPI specification JSON

## 🔄 How It Works

1. **Supabase Integration**: Supabase automatically generates OpenAPI 2.0 specifications for your database schema through PostgREST
2. **Specification Fetching**: The app fetches your API spec from `https://your-project.supabase.co/rest/v1/`
3. **Enhancement**: Adds custom branding and metadata to the specification
4. **Presentation**: Swagger UI renders the interactive documentation
5. **Authentication**: Includes proper headers for API testing

## 🚨 Troubleshooting

### Common Issues

**Documentation not loading?**
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that your Supabase project is active
- Ensure the trailing slash is included in API calls

**Styling not applying?**
- Clear your browser cache
- Check the browser console for CSS errors

**API calls failing in Swagger UI?**
- Verify your RLS (Row Level Security) policies allow anonymous access where needed
- Check that your anon key has the necessary permissions

### Getting Help

- Check the [Vercel documentation](https://vercel.com/docs)
- Review [Supabase API documentation](https://supabase.com/docs/guides/api)
- Visit [Swagger UI documentation](https://swagger.io/docs/open-source-tools/swagger-ui/)

## 🧪 Testing

Test your deployment:

```bash
# Health check
curl https://your-app.vercel.app/health

# API specification
curl https://your-app.vercel.app/api/spec
```

## 📈 Performance

- **Cold start**: ~500ms (typical for Vercel serverless functions)
- **Warm requests**: ~50-100ms
- **Static assets**: Cached at edge locations globally

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📄 License

This project is part of the Pica Loco mobile app ecosystem.

---

**Built with ❤️ for the Pica Loco community**

For questions or support, visit our [GitHub repository](https://github.com/your-username/picaloco-api-docs) or contact the development team.