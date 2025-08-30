import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from '@shopify/polaris';
import { Provider as AppBridgeProvider } from '@shopify/app-bridge-react';
import { QueryClient, QueryClientProvider } from 'react-query';
import '@shopify/polaris/build/esm/styles.css';

import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import Onboarding from './pages/Onboarding';
import AppFrame from './components/AppFrame';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Get app configuration from URL parameters or environment
const getAppConfig = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const host = urlParams.get('host');
  
  // Only return config if we have a valid Shopify host
  if (host) {
    return {
      apiKey: process.env.REACT_APP_SHOPIFY_API_KEY || 'demo-api-key',
      host: host,
      shop: urlParams.get('shop') || 'demo-shop.myshopify.com',
    };
  }
  
  return null;
};

function App() {
  const config = getAppConfig();

  const AppContent = () => {
    // Check if running in Shopify admin (embedded mode)
    const isEmbedded = config !== null;
    
    return (
      <QueryClientProvider client={queryClient}>
        <AppProvider
          i18n={{
            Polaris: {
              Common: {
                checkbox: 'checkbox',
              },
              ResourceList: {
                sortingLabel: 'Sort by',
                defaultItemSingular: 'item',
                defaultItemPlural: 'items',
                showing: 'Showing {itemsCount} {resource}',
                Item: {
                  viewItem: 'View details for {itemName}',
                },
              },
            },
          }}
        >
          <Router>
            {isEmbedded ? (
              // Embedded mode - no AppFrame, direct content
              <div style={{ padding: '20px' }}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                </Routes>
              </div>
            ) : (
              // Standalone mode - full AppFrame
              <AppFrame>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                </Routes>
              </AppFrame>
            )}
          </Router>
        </AppProvider>
      </QueryClientProvider>
    );
  };

  // If we have a valid Shopify config, wrap with AppBridge
  if (config) {
    return (
      <AppBridgeProvider config={config}>
        <AppContent />
      </AppBridgeProvider>
    );
  }

  // For local development, render without AppBridge
  return <AppContent />;
}

export default App;