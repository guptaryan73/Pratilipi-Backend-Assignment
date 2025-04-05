const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');

// Import Kafka producer
const { setupKafkaProducer } = require('./kafka/producer');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/users', userRoutes);

// Root route - welcome page
app.get('/', (req, res) => {
  res.status(200).json({
    service: 'User Service',
    version: '1.0.0',
    endpoints: [
      { method: 'GET', path: '/api/users', description: 'Get all users (admin only)' },
      { method: 'POST', path: '/api/users/register', description: 'Register a new user' },
      { method: 'POST', path: '/api/users/login', description: 'Login' }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', service: 'user-service' });
});

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/user-service')
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Setup Kafka producer
    setupKafkaProducer().then(() => {
      console.log('Kafka producer setup complete');
      
      // Start consumer to listen for events from other services
      require('./kafka/consumer');
      
      // Start server
      const PORT = process.env.PORT || 3001;
      app.listen(PORT, () => {
        console.log(`User service running on port ${PORT}`);
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