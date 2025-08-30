# Smart Order Tracking App for Shopify

A comprehensive Shopify app that provides merchants with advanced order tracking capabilities, customer notifications, and analytics dashboard.

## Features

- 📦 **Order Tracking Dashboard** - Real-time order status and tracking information
- 🎨 **Customizable Tracking Page** - Branded tracking experience for customers
- 📊 **Analytics & Insights** - Track performance metrics and customer behavior
- ⚙️ **Merchant Settings** - Easy configuration and customization options
- 🔔 **Automated Notifications** - Email and SMS notifications for order updates
- 📱 **Mobile Responsive** - Works seamlessly on all devices

## Tech Stack

- **Frontend**: React, Shopify Polaris, React Query
- **Backend**: Node.js, Express, Shopify API
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: Shopify App Bridge
- **Deployment**: Ready for Heroku, Railway, or any Node.js hosting

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Shopify Partners account
- Development store for testing

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd tracking_app

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 2. Create Shopify App

1. Go to [Shopify Partners Dashboard](https://partners.shopify.com/)
2. Create a new app
3. Note down your API key and secret

### 3. Environment Setup

#### Server Environment (.env)
```bash
cp .env.example .env
```

Update `.env` with your values:
```env
SHOPIFY_API_KEY=your_api_key_here
SHOPIFY_API_SECRET=your_api_secret_here
SCOPES=write_orders,read_orders,read_fulfillments,write_themes,read_themes,write_script_tags,read_script_tags,read_products,write_products
SHOPIFY_APP_URL=https://your-ngrok-url.ngrok.io
HOST=your-ngrok-url.ngrok.io
SESSION_SECRET=your_secure_random_string_here
DEV_STORE_URL=your-dev-store.myshopify.com
```

#### Client Environment (client/.env)
```bash
cd client
cp .env.example .env
```

Update `client/.env`:
```env
REACT_APP_SHOPIFY_API_KEY=your_api_key_here
REACT_APP_API_BASE_URL=http://localhost:3000/api
```

### 4. Local Development

#### Option A: Using ngrok (Recommended)

1. Install ngrok: `npm install -g ngrok`
2. Start the server:
   ```bash
   cd server
   npm start
   ```
3. In another terminal, start ngrok:
   ```bash
   ngrok http 3000
   ```
4. Update your `.env` files with the ngrok URL
5. Update Shopify app settings with ngrok URLs
6. Start the client:
   ```bash
   cd client
   npm start
   ```

#### Option B: Local Testing Only

1. Start the test server:
   ```bash
   cd server
   npm run test-server
   ```
2. Start the client:
   ```bash
   cd client
   npm start
   ```

### 5. Shopify App Configuration

In your Shopify Partners dashboard, configure:

**App URLs:**
- App URL: `https://your-ngrok-url.ngrok.io`
- Allowed redirection URLs:
  - `https://your-ngrok-url.ngrok.io/auth/callback`
  - `https://your-ngrok-url.ngrok.io/auth/shopify/callback`
  - `https://your-ngrok-url.ngrok.io/api/auth/callback`

**App Scopes:**
Ensure these scopes are enabled:
- `read_orders`, `write_orders`
- `read_products`, `write_products`
- `read_fulfillments`
- `read_themes`, `write_themes`
- `read_script_tags`, `write_script_tags`

## Production Deployment

### Automated Deployment

Use the included deployment script:

```bash
node deploy.js
```

This will:
- ✅ Check environment configuration
- ✅ Validate required variables
- ✅ Build the client application
- ✅ Install dependencies
- ✅ Provide deployment instructions

### Manual Deployment Steps

1. **Prepare Environment Files**
   ```bash
   cp .env.production .env
   cp client/.env.production client/.env
   ```

2. **Update Production Variables**
   - Replace all placeholder values
   - Use your production domain instead of ngrok
   - Generate secure session secrets

3. **Build Client**
   ```bash
   cd client
   npm run build
   ```

4. **Deploy to Hosting Platform**

   **Heroku:**
   ```bash
   heroku create your-app-name
   heroku config:set SHOPIFY_API_KEY=your_key
   heroku config:set SHOPIFY_API_SECRET=your_secret
   # ... set all environment variables
   git push heroku main
   ```

   **Railway:**
   ```bash
   railway login
   railway new
   railway add
   railway deploy
   ```

5. **Update Shopify App Settings**
   - Change app URL to your production domain
   - Update all redirect URLs
   - Test with development store

## Project Structure

```
tracking_app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # App pages
│   │   └── utils/         # Utilities and API client
│   └── public/
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   ├── models/           # Database models
│   └── services/         # Business logic
├── extensions/           # Shopify theme extension
└── deploy.js            # Deployment script
```

## API Endpoints

### Settings
- `GET /api/settings` - Get app settings
- `PUT /api/settings` - Update app settings

### Orders
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Get specific order
- `PUT /api/orders/:id` - Update order

### Tracking
- `GET /api/tracking/:number` - Get tracking info
- `PUT /api/tracking/:number` - Update tracking

### Health
- `GET /api/health` - Health check

## Development Scripts

```bash
# Server
cd server
npm start          # Start production server
npm run dev        # Start development server
npm run test-server # Start test server (no Shopify auth)

# Client
cd client
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests

# Root
node deploy.js     # Run deployment checks
```

## Environment Variables Reference

### Server (.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `SHOPIFY_API_KEY` | Your Shopify app API key | Yes |
| `SHOPIFY_API_SECRET` | Your Shopify app secret | Yes |
| `SCOPES` | Comma-separated app scopes | Yes |
| `SHOPIFY_APP_URL` | Your app's public URL | Yes |
| `HOST` | Your app's hostname | Yes |
| `SESSION_SECRET` | Secure random string for sessions | Yes |
| `DATABASE_URL` | Database connection string | No |
| `DEV_STORE_URL` | Development store URL | No |

### Client (client/.env)
| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_SHOPIFY_API_KEY` | Shopify API key (public) | Yes |
| `REACT_APP_API_BASE_URL` | Backend API base URL | Yes |

## Troubleshooting

### Common Issues

**"App installation failed"**
- Check that your ngrok URL is correct
- Verify redirect URLs in Shopify settings
- Ensure app scopes match your requirements

**"API calls failing"**
- Verify environment variables are set
- Check that backend server is running
- Confirm API endpoints are accessible

**"Components not rendering"**
- Check browser console for errors
- Verify Polaris components are imported correctly
- Ensure App Bridge is properly configured

### Getting Help

1. Check the [Shopify App Development docs](https://shopify.dev/docs/apps)
2. Review [Shopify Polaris components](https://polaris.shopify.com/)
3. Check [App Bridge documentation](https://shopify.dev/docs/api/app-bridge)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Ready to deploy?** Run `node deploy.js` to get started! 🚀