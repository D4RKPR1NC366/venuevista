#!/usr/bin/env node

// Hostinger startup script
// Environment variables are set by PHP bootstrap

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start the server
require('./server/index.js');