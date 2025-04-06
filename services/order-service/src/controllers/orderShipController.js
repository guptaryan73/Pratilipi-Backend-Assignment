const Order = require('../models/orderModel');
const { produceMessage } = require('../kafka/producer');

/**
 * Ship an order
 */
exports.shipOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }

    // Check if order can be shipped
    if (order.status !== 'processing') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot ship order with status: ${order.status}. Order must be in 'processing' status.`
      });
    }

    // Update status to shipped
    order.status = 'shipped';
    order.updatedAt = Date.now();
    await order.save();

    // Emit "Order Shipped" event
    await produceMessage('order-events', {
      type: 'ORDER_SHIPPED',
      payload: {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
        items: order.items.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity
        })),
        status: order.status,
        updatedAt: order.updatedAt
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to ship order'
    });
  }
};