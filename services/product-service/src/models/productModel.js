const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A product must have a name'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'A product must have a description'],
      trim: true
    },
    price: {
      type: Number,
      required: [true, 'A product must have a price'],
      min: [0, 'Price must be positive']
    },
    inventory: {
      type: Number,
      required: [true, 'A product must have inventory'],
      min: [0, 'Inventory cannot be negative'],
      default: 0
    },
    category: {
      type: String,
      required: [true, 'A product must have a category'],
      trim: true
    },
    imageUrl: {
      type: String,
      default: 'default-product.jpg'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Update the updatedAt field on save
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for checking if product is in stock
productSchema.virtual('inStock').get(function() {
  return this.inventory > 0;
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;