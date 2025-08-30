# Deployment Guide for Shopify Tracking App

This guide will help you deploy your Shopify tracking app to live servers using free hosting platforms.

## Prerequisites

1. GitHub account
2. Render account (for backend) - https://render.com
3. Netlify account (for frontend) - https://netlify.com
4. Your Shopify API credentials

## Step 1: Push to GitHub

1. Create a new repository on GitHub
2. Add the remote origin:
   ```bash
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy Backend to Render

1. Go to https://render.com and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `shopify-tracking-backend`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Add Environment Variables in Render dashboard:
   ```
   SHOPIFY_API_KEY=your_actual_api_key
   SHOPIFY_API_SECRET=your_actual_api_secret
   SCOPES=write_orders,read_orders,read_fulfillments,write_themes,read_themes,write_script_tags,read_script_tags,read_products,write_products
   NODE_ENV=production
   PORT=3001
   SESSION_SECRET=your_32_character_random_string
   DATABASE_URL=./database.sqlite
   ```

6. Deploy and note your backend URL (e.g., `https://shopify-tracking-backend.onrender.com`)

## Step 3: Deploy Frontend to Netlify

1. Go to https://netlify.com and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `client/build`

5. Add Environment Variables in Netlify dashboard:
   ```
   REACT_APP_SHOPIFY_API_KEY=your_actual_api_key
   REACT_APP_API_BASE_URL=https://your-backend-url.onrender.com
   ```

6. Deploy and note your frontend URL (e.g., `https://shopify-tracking-app.netlify.app`)

## Step 4: Update Backend Environment Variables

Go back to Render and update these environment variables with your actual URLs:
```
SHOPIFY_APP_URL=https://your-backend-url.onrender.com
HOST=https://your-backend-url.onrender.com
TUNNEL_URL=your-backend-url.onrender.com
FRONTEND_URL=https://your-frontend-url.netlify.app
```

## Step 5: Update Shopify Partner Dashboard

1. Go to your Shopify Partners Dashboard
2. Select your app
3. Go to "App setup" → "URLs"
4. Update:
   - **App URL**: `https://your-backend-url.onrender.com`
   - **Allowed redirection URLs**: `https://your-backend-url.onrender.com/api/auth/callback`

## Step 6: Test Installation

1. Go to your development store
2. Try installing the app using the live URLs
3. The 503 tunnel errors should be resolved

## Troubleshooting

- **Backend not starting**: Check Render logs for errors
- **Frontend build failing**: Check Netlify deploy logs
- **CORS errors**: Ensure FRONTEND_URL is correctly set in backend
- **OAuth errors**: Verify redirect URLs in Shopify dashboard match your backend URL

## Free Tier Limitations

- **Render**: Apps sleep after 15 minutes of inactivity (first request may be slow)
- **Netlify**: 100GB bandwidth per month, 300 build minutes

For production apps with high traffic, consider upgrading to paid plans.