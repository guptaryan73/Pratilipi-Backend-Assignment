const { Kafka } = require('kafkajs');
const User = require('../models/userModel');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'user-service-consumer',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092']
});

// Create consumer
const consumer = kafka.consumer({ groupId: 'user-service-group' });

/**
 * Handle incoming messages from Kafka topics
 */
const handleMessage = async ({ topic, partition, message }) => {
  try {
    const messageValue = JSON.parse(message.value.toString());
    console.log(`Received message from ${topic}:`, messageValue.type);

    switch (messageValue.type) {
      case 'ORDER_PLACED':
        // Handle order placed event if needed
        console.log('Order placed for user:', messageValue.payload.userId);
        break;
      
      case 'PRODUCT_CREATED':
        // Handle product created event if needed
        console.log('New product created:', messageValue.payload.productId);
        break;
      
      default:
        console.log('Unhandled message type:', messageValue.type);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
};

/**
 * Start Kafka consumer
 */
const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log('Kafka consumer connected');

    // Subscribe to relevant topics
    await consumer.subscribe({ topics: ['order-events', 'product-events'], fromBeginning: false });

    await consumer.run({
      eachMessage: handleMessage
    });

    console.log('Kafka consumer started');
  } catch (error) {
    console.error('Error starting Kafka consumer:', error);
  }
};

// Start consumer
startConsumer();

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka consumer:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka consumer:', error);
  }
  process.exit(0);
});