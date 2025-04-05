const { gql } = require('apollo-server-express');

const typeDefs = gql`
  # User types
  type User {
    id: ID!
    name: String!
    email: String!
    role: String!
    createdAt: String!
    orders: [Order]
  }

  # Product types
  type Product {
    id: ID!
    name: String!
    description: String!
    price: Float!
    inventory: Int!
    category: String!
    imageUrl: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
  }

  # Order types
  type OrderItem {
    productId: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  type Order {
    id: ID!
    userId: ID!
    user: User
    items: [OrderItem!]!
    products: [Product]
    totalAmount: Float!
    status: String!
    shippingAddress: String!
    paymentMethod: String!
    paymentStatus: String!
    createdAt: String!
    updatedAt: String!
  }

  # Input types
  input ProductInput {
    name: String!
    description: String!
    price: Float!
    inventory: Int!
    category: String!
    imageUrl: String
  }

  input OrderItemInput {
    productId: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  input OrderInput {
    userId: ID!
    items: [OrderItemInput!]!
    totalAmount: Float!
    shippingAddress: String!
    paymentMethod: String!
  }

  # Queries
  type Query {
    # User queries
    getUser(id: ID!): User
    getUsers: [User]
    
    # Product queries
    getProduct(id: ID!): Product
    getProducts(category: String): [Product]
    
    # Order queries
    getOrder(id: ID!): Order
    getUserOrders(userId: ID!): [Order]
    getOrders: [Order]
  }

  # Mutations
  type Mutation {
    # Product mutations
    createProduct(product: ProductInput!): Product
    updateProduct(id: ID!, product: ProductInput!): Product
    updateInventory(id: ID!, quantity: Int!): Product
    deleteProduct(id: ID!): Boolean
    
    # Order mutations
    createOrder(order: OrderInput!): Order
    updateOrderStatus(id: ID!, status: String!): Order
    cancelOrder(id: ID!): Order
  }
`;

module.exports = typeDefs;