const Order = require('../models/orderModel');
const { produceMessage } = require('../kafka/producer');

/**
 * Create a new order
 */
exports.createOrder = async (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress, paymentMethod } = req.body;

    // Validate required fields
    if (!userId || !items || !totalAmount || !shippingAddress || !paymentMethod) {
      return res.status(400).json({
        status: 'fail',
        message: 'Missing required fields'
      });
    }

    // Create new order
    const newOrder = await Order.create({
      userId,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod
    });

    // Emit "Order Placed" event
    await produceMessage('order-events', {
      type: 'ORDER_PLACED',
      payload: {
        orderId: newOrder._id.toString(),
        userId: newOrder.userId.toString(),
        items: newOrder.items.map(item => ({
          productId: item.productId.toString(),
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: newOrder.totalAmount,
        status: newOrder.status,
        createdAt: newOrder.createdAt
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        order: newOrder
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create order'
    });
  }
};

/**
 * Get all orders for a user
 */
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId }).sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get orders'
    });
  }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get order'
    });
  }
};

/**
 * Update order status
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        status: 'fail',
        message: 'Status is required'
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }

    // Update status
    order.status = status;
    order.updatedAt = Date.now();
    await order.save();

    // Emit "Order Status Updated" event
    await produceMessage('order-events', {
      type: 'ORDER_STATUS_UPDATED',
      payload: {
        orderId: order._id.toString(),
        userId: order.userId.toString(),
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
    console.error('Error updating order status:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
};

/**
 * Cancel order
 */
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        status: 'fail',
        message: 'Order not found'
      });
    }

    // Check if order can be cancelled
    if (order.status === 'shipped' || order.status === 'delivered') {
      return res.status(400).json({
        status: 'fail',
        message: `Cannot cancel order in ${order.status} status`
      });
    }

    // Update status to cancelled
    order.status = 'cancelled';
    order.updatedAt = Date.now();
    await order.save();

    // Emit "Order Cancelled" event
    await produceMessage('order-events', {
      type: 'ORDER_CANCELLED',
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
    console.error('Error cancelling order:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order'
    });
  }
};

/**
 * Get all orders (admin only)
 */
exports.getAllOrders = async (req, res) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Filter by status if provided
    let query = Order.find(queryObj);

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Execute query
    const orders = await query;

    res.status(200).json({
      status: 'success',
      results: orders.length,
      data: {
        orders
      }
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get orders'
    });
  }
};