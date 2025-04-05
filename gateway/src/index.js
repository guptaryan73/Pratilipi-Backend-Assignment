const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Optional: Add Redis cache when stable
// const { KeyvAdapter } = require('@apollo/utils.keyvadapter');
// const Keyv = require('keyv');
// const KeyvRedis = require('@keyv/redis');

// Import schema and resolvers
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Root route - welcome page
app.get('/', (req, res) => {
  const PORT = process.env.PORT || 3000;
  res.status(200).json({
    service: 'GraphQL API Gateway',
    version: '1.0.0',
    endpoints: [
      { method: 'POST', path: '/graphql', description: 'GraphQL API endpoint' },
      { method: 'GET', path: '/graphql', description: 'GraphQL Playground (UI)' }
    ],
    graphqlUrl: `http://localhost:${PORT}/graphql`
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'api-gateway' });
});

// Create Apollo Server
async function startApolloServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      // You can add authentication logic here
      return { 
        token: req.headers.authorization || '',
        // Add service URLs to context for easier access
        serviceUrls: {
          user: process.env.USER_SERVICE_URL || 'http://localhost:3001/api',
          product: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002/api',
          order: process.env.ORDER_SERVICE_URL || 'http://localhost:3003/api'
        }
      };
    },
    formatError: (error) => {
      console.error('GraphQL Error:', error);
      return {
        message: error.message,
        path: error.path,
        extensions: error.extensions
      };
    }
  });

  await server.start();
  
  // Apply middleware
  server.applyMiddleware({ app, path: '/graphql' });
  
  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
  });
}

// Start server
startApolloServer().catch(err => {
  console.error('Failed to start server:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app; // For testing purposes