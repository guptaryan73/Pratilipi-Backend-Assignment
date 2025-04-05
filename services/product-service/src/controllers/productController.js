const Product = require('../models/productModel');
const { produceMessage } = require('../kafka/producer');

/**
 * Create a new product
 */
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, inventory, category, imageUrl } = req.body;

    // Create new product
    const newProduct = await Product.create({
      name,
      description,
      price,
      inventory,
      category,
      imageUrl
    });

    // Emit "Product Created" event
    await produceMessage('product-events', {
      type: 'PRODUCT_CREATED',
      payload: {
        productId: newProduct._id.toString(),
        name: newProduct.name,
        price: newProduct.price,
        inventory: newProduct.inventory,
        category: newProduct.category,
        createdAt: newProduct.createdAt
      }
    });

    res.status(201).json({
      status: 'success',
      data: {
        product: newProduct
      }
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create product'
    });
  }
};

/**
 * Get all products
 */
exports.getAllProducts = async (req, res) => {
  try {
    // Build query
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Filter by category if provided
    let query = Product.find(queryObj);

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Execute query
    const products = await query;

    res.status(200).json({
      status: 'success',
      results: products.length,
      data: {
        products
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get products'
    });
  }
};

/**
 * Get product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get product'
    });
  }
};

/**
 * Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }

    // Check if inventory was updated
    if (req.body.inventory !== undefined) {
      // Emit "Inventory Updated" event
      await produceMessage('product-events', {
        type: 'INVENTORY_UPDATED',
        payload: {
          productId: updatedProduct._id.toString(),
          name: updatedProduct.name,
          inventory: updatedProduct.inventory,
          updatedAt: Date.now()
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        product: updatedProduct
      }
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update product'
    });
  }
};

/**
 * Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete product'
    });
  }
};

/**
 * Update product inventory
 */
exports.updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity === undefined) {
      return res.status(400).json({
        status: 'fail',
        message: 'Quantity is required'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        status: 'fail',
        message: 'Product not found'
      });
    }

    // Update inventory
    product.inventory = quantity;
    await product.save();

    // Emit "Inventory Updated" event
    await produceMessage('product-events', {
      type: 'INVENTORY_UPDATED',
      payload: {
        productId: product._id.toString(),
        name: product.name,
        inventory: product.inventory,
        updatedAt: Date.now()
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        product
      }
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update inventory'
    });
  }
};