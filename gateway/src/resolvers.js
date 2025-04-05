const axios = require('axios');

// Service URLs
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001/api';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002/api';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://localhost:3003/api';

// Helper function to handle API requests
const apiRequest = async (url, method = 'GET', data = null) => {
  try {
    const config = {
      method,
      url,
      ...(data && { data })
    };
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`API request error: ${url}`, error.message);
    throw new Error(error.response?.data?.message || error.message);
  }
};

const resolvers = {
  Query: {
    // User queries
    getUser: async (_, { id }) => {
      const response = await apiRequest(`${USER_SERVICE_URL}/users/${id}`);
      return { ...response.data.user, id: response.data.user._id };
    },
    
    getUsers: async () => {
      const response = await apiRequest(`${USER_SERVICE_URL}/users`);
      return response.data.users.map(user => ({ ...user, id: user._id }));
    },
    
    // Product queries
    getProduct: async (_, { id }) => {
      const response = await apiRequest(`${PRODUCT_SERVICE_URL}/products/${id}`);
      return { ...response.data.product, id: response.data.product._id };
    },
    
    getProducts: async (_, { category }) => {
      const url = category 
        ? `${PRODUCT_SERVICE_URL}/products?category=${category}`
        : `${PRODUCT_SERVICE_URL}/products`;
      
      const response = await apiRequest(url);
      return response.data.products.map(product => ({ ...product, id: product._id }));
    },
    
    // Order queries
    getOrder: async (_, { id }) => {
      const response = await apiRequest(`${ORDER_SERVICE_URL}/orders/${id}`);
      return { ...response.data.order, id: response.data.order._id };
    },
    
    getUserOrders: async (_, { userId }) => {
      const response = await apiRequest(`${ORDER_SERVICE_URL}/orders/user/${userId}`);
      return response.data.orders.map(order => ({ ...order, id: order._id }));
    },
    
    getOrders: async () => {
      const response = await apiRequest(`${ORDER_SERVICE_URL}/orders`);
      return response.data.orders.map(order => ({ ...order, id: order._id }));
    }
  },
  
  Mutation: {
    // Product mutations
    createProduct: async (_, { product }) => {
      const response = await apiRequest(
        `${PRODUCT_SERVICE_URL}/products`,
        'POST',
        product
      );
      return { ...response.data.product, id: response.data.product._id };
    },
    
    updateProduct: async (_, { id, product }) => {
      const response = await apiRequest(
        `${PRODUCT_SERVICE_URL}/products/${id}`,
        'PATCH',
        product
      );
      return { ...response.data.product, id: response.data.product._id };
    },
    
    updateInventory: async (_, { id, quantity }) => {
      const response = await apiRequest(
        `${PRODUCT_SERVICE_URL}/products/${id}/inventory`,
        'PATCH',
        { quantity }
      );
      return { ...response.data.product, id: response.data.product._id };
    },
    
    deleteProduct: async (_, { id }) => {
      await apiRequest(`${PRODUCT_SERVICE_URL}/products/${id}`, 'DELETE');
      return true;
    },
    
    // Order mutations
    createOrder: async (_, { order }) => {
      const response = await apiRequest(
        `${ORDER_SERVICE_URL}/orders`,
        'POST',
        order
      );
      return { ...response.data.order, id: response.data.order._id };
    },
    
    updateOrderStatus: async (_, { id, status }) => {
      const response = await apiRequest(
        `${ORDER_SERVICE_URL}/orders/${id}`,
        'PATCH',
        { status }
      );
      return { ...response.data.order, id: response.data.order._id };
    },
    
    cancelOrder: async (_, { id }) => {
      const response = await apiRequest(
        `${ORDER_SERVICE_URL}/orders/${id}/cancel`,
        'POST'
      );
      return { ...response.data.order, id: response.data.order._id };
    }
  },
  
  // Field resolvers
  Order: {
    user: async (order) => {
      if (!order.userId) return null;
      try {
        const response = await apiRequest(`${USER_SERVICE_URL}/users/${order.userId}`);
        return { ...response.data.user, id: response.data.user._id };
      } catch (error) {
        console.error(`Error fetching user for order ${order.id}:`, error.message);
        return null;
      }
    },
    
    products: async (order) => {
      if (!order.items || order.items.length === 0) return [];
      
      try {
        const productIds = order.items.map(item => item.productId);
        const productPromises = productIds.map(productId => 
          apiRequest(`${PRODUCT_SERVICE_URL}/products/${productId}`)
            .then(response => ({ ...response.data.product, id: response.data.product._id }))
            .catch(() => null)
        );
        
        const products = await Promise.all(productPromises);
        return products.filter(product => product !== null);
      } catch (error) {
        console.error(`Error fetching products for order ${order.id}:`, error.message);
        return [];
      }
    }
  },
  
  User: {
    orders: async (user) => {
      try {
        const response = await apiRequest(`${ORDER_SERVICE_URL}/orders/user/${user.id}`);
        return response.data.orders.map(order => ({ ...order, id: order._id }));
      } catch (error) {
        console.error(`Error fetching orders for user ${user.id}:`, error.message);
        return [];
      }
    }
  }
};

module.exports = resolvers;