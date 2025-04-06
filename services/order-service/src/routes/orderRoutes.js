const express = require('express');
const orderController = require('../controllers/orderController');
const orderShipController = require('../controllers/orderShipController');

const router = express.Router();

// Order routes
router
  .route('/')
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

router
  .route('/:id')
  .get(orderController.getOrderById)
  .patch(orderController.updateOrderStatus);

// Special routes
router.route('/:id/cancel').post(orderController.cancelOrder);
router.route('/:id/ship').post(orderShipController.shipOrder);
router.route('/user/:userId').get(orderController.getUserOrders);

module.exports = router;