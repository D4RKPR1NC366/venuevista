#!/usr/bin/env node

// Hostinger startup script
require('dotenv').config();

// Set production environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Start the server
require('./server/index.js');