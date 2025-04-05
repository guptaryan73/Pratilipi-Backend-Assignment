const { Kafka } = require('kafkajs');

// Initialize Kafka client
const kafka = new Kafka({
  clientId: 'order-service',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092']
});

// Create producer
const producer = kafka.producer();
let isConnected = false;

/**
 * Setup Kafka producer
 */
exports.setupKafkaProducer = async () => {
  try {
    await producer.connect();
    isConnected = true;
    console.log('Kafka producer connected');
  } catch (error) {
    console.error('Error connecting to Kafka producer:', error);
    throw error;
  }
};

/**
 * Produce message to Kafka topic
 * @param {string} topic - Kafka topic
 * @param {object} message - Message to send
 */
exports.produceMessage = async (topic, message) => {
  try {
    if (!isConnected) {
      await exports.setupKafkaProducer();
    }

    await producer.send({
      topic,
      messages: [
        { 
          key: message.payload?.orderId || 'default', 
          value: JSON.stringify(message) 
        }
      ]
    });

    console.log(`Message sent to topic ${topic}:`, message.type);
    return true;
  } catch (error) {
    console.error(`Error producing message to ${topic}:`, error);
    return false;
  }
};

/**
 * Disconnect Kafka producer
 */
exports.disconnectProducer = async () => {
  try {
    if (isConnected) {
      await producer.disconnect();
      isConnected = false;
      console.log('Kafka producer disconnected');
    }
  } catch (error) {
    console.error('Error disconnecting Kafka producer:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await exports.disconnectProducer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await exports.disconnectProducer();
  process.exit(0);
});