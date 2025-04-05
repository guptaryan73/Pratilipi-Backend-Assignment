# Pratilipi Backend Assignment

## Objective
Build a backend system with three microservices (User, Product, Order) communicating via a message queue (Kafka) for state management, exposed through a unified GraphQL API.

## GraphQL Playground / Explorer

You can access the GraphQL Playground to interact with the API schema and run test queries at the following URL:

https://studio.apollographql.com/graph/Pratilipi-Backend-Assignmen/variant/current/home



## Architecture
- **User Service**: Manages registration, JWT authentication, and profiles. Emits `user.registered`, `user.profile.updated`.
- **Product Service**: Handles product catalog and inventory. Emits `product.created`, `product.inventory.updated`. Listens to `order.placed`.
- **Order Service**: Processes orders. Emits `order.placed`, `order.shipped`. Listens to `user.registered`, `product.created`.
- **GraphQL Gateway**: Unified API endpoint for clients, aggregating data from microservices.
- **Kafka**: Asynchronous event streaming for decoupling.
- **MongoDB**: Dedicated instance per microservice.
- **Docker**: Containerizes all services.

## Directory Structure
```
├── docker-compose.yml
├── gateway/ # GraphQL Gateway (Node.js/Apollo)
│   └── .env
├── services/
│   ├── user-service/ # (Node.js/Express)
│   │   └── .env
│   ├── product-service/ # (Node.js/Express)
│   │   └── .env
│   └── order-service/ # (Node.js/Express)
│       └── .env
└── README.md
```

## Technologies
- **Backend**: Node.js, Express.js
- **Gateway**: GraphQL (Apollo Server)
- **Database**: MongoDB
- **Queue**: Apache Kafka
- **Auth**: JWT
- **Containerization**: Docker, Docker Compose
- **Package Manager**: npm

## Prerequisites
- **Docker**: [Install Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Node.js/npm**: [Install Node.js](https://nodejs.org/) (v14+ for local dev)
- **Git**

## Setup
1. **Clone Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Environment Variables**
   - Create `.env` files in `gateway/`, `services/user-service/`, `services/product-service/`, `services/order-service/`:
     - **Gateway**: `PORT=4000`, `USER_SERVICE_URL=http://user-service:3001`, etc.
     - **User Service**: `PORT=3001`, `MONGODB_URI=mongodb://user-db:27017/user-service`, `KAFKA_BOOTSTRAP_SERVERS=kafka:9092`, `JWT_SECRET=<secret>`
     - **Product Service**: `PORT=3002`, `MONGODB_URI=mongodb://product-db:27017/product-service`, `KAFKA_BOOTSTRAP_SERVERS=kafka:9092`
     - **Order Service**: `PORT=3003`, `MONGODB_URI=mongodb://order-db:27017/order-service`, `KAFKA_BOOTSTRAP_SERVERS=kafka:9092`

3. **Run with Docker Compose**
   ```bash
   docker-compose up -d
   ```
   - Access GraphQL Playground: `http://localhost:4000/graphql`
   - Stop: `docker-compose down` (or `docker-compose down -v` to clear data)

## GraphQL API
- **Queries**: `users`, `user(id)`, `products`, `product(id)`, `orders`, `order(id)`
- **Mutations**: 
  - `registerUser(input: {name, email, password})`
  - `createProduct(input: {name, description, price, inventory})`
  - `placeOrder(input: {userId, items, shippingAddress})`

## Event Communication (Kafka)
- **user.registered**: User Service → Order Service
- **product.created**: Product Service → Order Service
- **order.placed**: Order Service → Product Service
- **product.inventory.updated**: Product Service → Order Service (optional)

## Requirements Met
- **Async Communication**: Kafka for event-driven state updates.
- **GraphQL API**: Unified endpoint via Apollo Server.
- **Database**: Separate MongoDB per service.
- **State Management**: Event listeners ensure consistency.
- **Auth**: JWT in User Service, verified by Gateway.