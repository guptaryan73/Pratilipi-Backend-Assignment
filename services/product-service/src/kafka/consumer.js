const { Kafka } = require('kafkajs');
const Product = require('../models/productModel');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'product-service-consumer',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092']
});

// Create consumer
const consumer = kafka.consumer({ groupId: 'product-service-group' });

/**
 * Handle incoming messages from Kafka topics
 */
const handleMessage = async ({ topic, partition, message }) => {
  try {
    const messageValue = JSON.parse(message.value.toString());
    console.log(`Received message from ${topic}:`, messageValue.type);

    switch (messageValue.type) {
      case 'ORDER_PLACED':
        // Handle order placed event - update product inventory
        await handleOrderPlaced(messageValue.payload);
        break;
      
      case 'ORDER_CANCELLED':
        // Handle order cancelled event - restore product inventory
        await handleOrderCancelled(messageValue.payload);
        break;
      
      default:
        console.log('Unhandled message type:', messageValue.type);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
};

/**
 * Handle order placed event
 * @param {Object} payload - Order payload
 */
const handleOrderPlaced = async (payload) => {
  try {
    console.log('Processing order placed event:', payload.orderId);
    
    // Update inventory for each product in the order
    if (payload.items && Array.isArray(payload.items)) {
      for (const item of payload.items) {
        const product = await Product.findById(item.productId);
        
        if (product) {
          // Decrease inventory
          product.inventory = Math.max(0, product.inventory - item.quantity);
          product.updatedAt = Date.now();
          await product.save();
          
          console.log(`Updated inventory for product ${item.productId} to ${product.inventory}`);
        } else {
          console.warn(`Product not found: ${item.productId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error handling order placed event:', error);
  }
};

/**
 * Handle order cancelled event
 * @param {Object} payload - Order payload
 */
const handleOrderCancelled = async (payload) => {
  try {
    console.log('Processing order cancelled event:', payload.orderId);
    
    // Restore inventory for each product in the cancelled order
    if (payload.items && Array.isArray(payload.items)) {
      for (const item of payload.items) {
        const product = await Product.findById(item.productId);
        
        if (product) {
          // Increase inventory
          product.inventory += item.quantity;
          product.updatedAt = Date.now();
          await product.save();
          
          console.log(`Restored inventory for product ${item.productId} to ${product.inventory}`);
        } else {
          console.warn(`Product not found: ${item.productId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error handling order cancelled event:', error);
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
    await consumer.subscribe({ topics: ['order-events', 'user-events'], fromBeginning: false });

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