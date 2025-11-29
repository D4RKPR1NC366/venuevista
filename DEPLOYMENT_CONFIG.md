# Hostinger Node.js Application Configuration

This file helps Hostinger recognize and properly deploy the Node.js application.

## Application Type: Node.js
## Entry Point: app.js
## Port: 5051

## Required Environment Variables:
- NODE_ENV=production
- MONGODB_URI=mongodb+srv://goldust:goldustadmin@goldust.9lkqckv.mongodb.net/
- JWT_SECRET=goldust-production-jwt-secret-key-2024
- PORT=5051

## Deployment Instructions:
1. Set environment variables in Hostinger control panel
2. Deploy via Git with branch: my-final-branch
3. Application will start automatically using app.js entry point