#!/usr/bin/env node

/**
 * Deployment Script for Smart Order Tracking App
 * This script helps prepare and deploy the app to production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

function checkEnvironmentFiles() {
  log.title('🔍 Checking Environment Configuration');
  
  const requiredFiles = [
    '.env.production',
    'client/.env.production'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    if (!fs.existsSync(file)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    log.error('Missing environment files:');
    missingFiles.forEach(file => log.error(`  - ${file}`));
    log.warning('Please create these files with your production configuration.');
    return false;
  }
  
  log.success('All environment files found');
  return true;
}

function validateEnvironmentVariables() {
  log.title('🔧 Validating Environment Variables');
  
  const envFile = '.env.production';
  const envContent = fs.readFileSync(envFile, 'utf8');
  
  const requiredVars = [
    'SHOPIFY_API_KEY',
    'SHOPIFY_API_SECRET',
    'SHOPIFY_APP_URL',
    'HOST',
    'SESSION_SECRET'
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);
    
    if (!match) {
      missingVars.push(varName);
    } else if (match[1].includes('your_') || match[1].includes('here')) {
      placeholderVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    log.error('Missing environment variables:');
    missingVars.forEach(varName => log.error(`  - ${varName}`));
  }
  
  if (placeholderVars.length > 0) {
    log.warning('Environment variables with placeholder values:');
    placeholderVars.forEach(varName => log.warning(`  - ${varName}`));
  }
  
  if (missingVars.length > 0 || placeholderVars.length > 0) {
    log.error('Please update your .env.production file with actual values.');
    return false;
  }
  
  log.success('All environment variables configured');
  return true;
}

function buildClient() {
  log.title('🏗️  Building Client Application');
  
  try {
    process.chdir('client');
    log.info('Installing client dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    log.info('Building production client...');
    execSync('npm run build', { stdio: 'inherit' });
    
    process.chdir('..');
    log.success('Client build completed');
    return true;
  } catch (error) {
    log.error('Client build failed');
    log.error(error.message);
    return false;
  }
}

function installServerDependencies() {
  log.title('📦 Installing Server Dependencies');
  
  try {
    process.chdir('server');
    log.info('Installing server dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    
    process.chdir('..');
    log.success('Server dependencies installed');
    return true;
  } catch (error) {
    log.error('Server dependency installation failed');
    log.error(error.message);
    return false;
  }
}

function runPreDeploymentChecks() {
  log.title('🔍 Running Pre-deployment Checks');
  
  const checks = [
    { name: 'Environment files', fn: checkEnvironmentFiles },
    { name: 'Environment variables', fn: validateEnvironmentVariables },
    { name: 'Server dependencies', fn: installServerDependencies },
    { name: 'Client build', fn: buildClient }
  ];
  
  for (const check of checks) {
    log.info(`Running ${check.name} check...`);
    if (!check.fn()) {
      log.error(`${check.name} check failed`);
      return false;
    }
  }
  
  return true;
}

function displayDeploymentInstructions() {
  log.title('🚀 Deployment Instructions');
  
  console.log(`${colors.bright}Your app is ready for deployment!${colors.reset}\n`);
  
  console.log('Next steps:');
  console.log('1. Deploy your server to a hosting platform (Heroku, Railway, etc.)');
  console.log('2. Update your Shopify app settings with the production URL');
  console.log('3. Set up your environment variables on the hosting platform');
  console.log('4. Test your app with a development store');
  
  console.log('\nImportant URLs to configure in Shopify:');
  console.log('- App URL: https://your-domain.com');
  console.log('- Allowed redirection URLs:');
  console.log('  - https://your-domain.com/auth/callback');
  console.log('  - https://your-domain.com/auth/shopify/callback');
  console.log('  - https://your-domain.com/api/auth/callback');
  
  console.log('\nFor local testing with ngrok:');
  console.log('1. Run: npx ngrok http 3000');
  console.log('2. Update .env with the ngrok URL');
  console.log('3. Update Shopify app settings with the ngrok URL');
}

function main() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║              Smart Order Tracking App Deployment            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);
  
  if (runPreDeploymentChecks()) {
    log.success('All pre-deployment checks passed!');
    displayDeploymentInstructions();
  } else {
    log.error('Pre-deployment checks failed. Please fix the issues above.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  checkEnvironmentFiles,
  validateEnvironmentVariables,
  buildClient,
  installServerDependencies,
  runPreDeploymentChecks
};