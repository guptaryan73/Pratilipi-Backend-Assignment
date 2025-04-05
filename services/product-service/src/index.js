const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const productRoutes = require('./routes/productRoutes');

// Import Kafka producer
const { setupKafkaProducer } = require('./kafka/producer');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/products', productRoutes);

// Root route - welcome page
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'Product Service',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/products', description: 'Get all products' },
      { method: 'GET', path: '/api/products/:id', description: 'Get product by ID' },
      { method: 'POST', path: '/api/products', description: 'Create a new product' }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'product-service' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/product-service')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Setup Kafka producer
    setupKafkaProducer().then(() => {
      console.log('Kafka producer setup complete');
      
      // Start consumer to listen for events from other services
      require('./kafka/consumer');
      
      // Start server
      const PORT = process.env.PORT || 3002;
      app.listen(PORT, () => {
        console.log(`Product service running on port ${PORT}`);
      });
    }).catch(err => {
      console.error('Failed to setup Kafka producer:', err);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app; // For testing purposes