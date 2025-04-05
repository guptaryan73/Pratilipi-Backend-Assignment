const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

// Product routes
router
  .route('/')
  .get(productController.getAllProducts)
  .post(productController.createProduct);

router
  .route('/:id')
  .get(productController.getProductById)
  .patch(productController.updateProduct)
  .delete(productController.deleteProduct);

// Special route for inventory updates
router.route('/:id/inventory')
  .patch(productController.updateInventory);

module.exports = router;