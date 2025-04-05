# User Service

This microservice handles user registration, authentication, and profile management. It uses JWT for authentication and Kafka for event-driven communication with other services.

## Features

- User registration and authentication
- JWT-based authentication
- Role-based access control (user/admin)
- Profile management
- Event emission for user registration and profile updates

## API Endpoints

### Public Endpoints

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login a user

### Protected Endpoints (require authentication)

- `GET /api/users/profile` - Get current user profile
- `PATCH /api/users/profile` - Update user profile

### Admin Only Endpoints

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID

## Events

### Emitted Events

- `USER_REGISTERED` - Emitted when a new user is registered
- `USER_PROFILE_UPDATED` - Emitted when a user's profile is updated

### Consumed Events

- `ORDER_PLACED` - Consumed from Order Service
- `PRODUCT_CREATED` - Consumed from Product Service

## Environment Variables

- `PORT` - Port to run the service on (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation
- `JWT_EXPIRES_IN` - JWT token expiration time (default: 30d)
- `KAFKA_BOOTSTRAP_SERVERS` - Kafka bootstrap servers

## Setup

### Local Development

1. Install dependencies:
   ```
   npm install
   ```

2. Start the service:
   ```
   npm run dev
   ```

### Docker

Build and run using Docker:

```
docker build -t user-service .
docker run -p 3001:3001 user-service
```

Or use Docker Compose from the root directory:

```
docker-compose up user-service
```