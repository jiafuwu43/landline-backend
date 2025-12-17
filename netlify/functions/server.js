const serverless = require('serverless-http');
const app = require('../../src/server');

// Export the serverless-wrapped app for Netlify Functions
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

