const { Kafka } = require('kafkajs');
const Order = require('../models/orderModel');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'order-service-consumer',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092']
});

// Create consumer
const consumer = kafka.consumer({ groupId: 'order-service-group' });

/**
 * Handle incoming messages from Kafka topics
 */
const handleMessage = async ({ topic, partition, message }) => {
  try {
    const messageValue = JSON.parse(message.value.toString());
    console.log(`Received message from ${topic}:`, messageValue.type);

    switch (messageValue.type) {
      case 'INVENTORY_UPDATED':
        // Handle inventory update event
        await handleInventoryUpdated(messageValue.payload);
        break;
      
      case 'PRODUCT_CREATED':
        // Handle product created event if needed
        console.log('New product created:', messageValue.payload.productId);
        break;
      
      case 'USER_REGISTERED':
        // Handle user registered event if needed
        console.log('New user registered:', messageValue.payload.userId);
        break;
      
      default:
        console.log('Unhandled message type:', messageValue.type);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
};

/**
 * Handle inventory updated event
 * @param {Object} payload - Inventory update payload
 */
const handleInventoryUpdated = async (payload) => {
  try {
    console.log('Processing inventory update event for product:', payload.productId);
    
    // Check if there are any pending orders with this product
    // If inventory is now 0, we might need to handle backorders or notify users
    if (payload.inventory === 0) {
      // Find pending orders containing this product
      const pendingOrders = await Order.find({
        'items.productId': payload.productId,
        'status': 'pending'
      });
      
      if (pendingOrders.length > 0) {
        console.log(`Found ${pendingOrders.length} pending orders affected by stock-out`);
        // Here you could implement logic to notify users or mark orders as backordered
      }
    }
  } catch (error) {
    console.error('Error handling inventory updated event:', error);
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
    await consumer.subscribe({ topics: ['product-events', 'user-events'], fromBeginning: false });

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