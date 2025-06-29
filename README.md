# NaijaStore Ecommerce API

A comprehensive Next.js 14 API backend for ecommerce applications with authentication, product management, shopping cart, orders, and payment processing.

## Features

### Authentication & User Management
- User registration with email verification
- JWT-based authentication with refresh tokens
- Password reset functionality
- User profile management
- Shipping address management

### Product & Catalog Management
- Product CRUD operations
- Category management
- Product search with filters and pagination
- Stock management

### Shopping & Orders
- Shopping cart management
- Order creation and tracking
- Order history
- Order status updates

### Shipping & Logistics
- Nigerian shipping zones
- Shipping cost calculation
- Delivery time estimates
- Order tracking

### Payment Processing
- Flutterwave integration
- Payment verification
- Webhook handling
- Payment status tracking

### Additional Features
- Email notifications
- Rate limiting
- CORS configuration
- Input validation with Zod
- Comprehensive error handling
- Admin role management

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/user/addresses` - Get user addresses
- `POST /api/user/addresses` - Create new address
- `PUT /api/user/addresses/[id]` - Update address
- `DELETE /api/user/addresses/[id]` - Delete address

### Products & Categories
- `GET /api/products` - Get products with pagination
- `POST /api/products` - Create product (Admin)
- `GET /api/products/[id]` - Get single product
- `PUT /api/products/[id]` - Update product (Admin)
- `DELETE /api/products/[id]` - Delete product (Admin)
- `GET /api/products/search` - Search products with filters
- `GET /api/categories` - Get categories
- `POST /api/categories` - Create category (Admin)

### Shopping Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/[id]` - Update cart item
- `DELETE /api/cart/[id]` - Remove cart item

### Orders
- `GET /api/orders` - Get user orders
- `POST /api/orders` - Create new order
- `GET /api/orders/[id]` - Get order details
- `GET /api/orders/[id]/track` - Get order tracking info

### Shipping
- `POST /api/shipping/calculate` - Calculate shipping cost
- `GET /api/shipping/zones` - Get shipping zones

### Payments
- `POST /api/payments/flutterwave` - Initialize payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Payment webhook

### Notifications
- `POST /api/notifications/email` - Send email (Admin)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update environment variables with your actual values

4. Run development server:
```bash
npm run dev
```

## Environment Variables

- `NEXT_PUBLIC_APP_URL` - Your app URL
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `EMAIL_SERVICE` - Email service provider
- `EMAIL_API_KEY` - Email service API key
- `FLUTTERWAVE_PUBLIC_KEY` - Flutterwave public key
- `FLUTTERWAVE_SECRET_KEY` - Flutterwave secret key

## Database

This implementation uses in-memory storage for demonstration. In production, replace the mock database in `lib/database.ts` with your preferred database solution (PostgreSQL, MongoDB, etc.).

## Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Rate Limiting

API endpoints have rate limiting implemented:
- Auth endpoints: 5-10 requests per 15 minutes
- Other endpoints: 100 requests per 15 minutes

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message"
}
```

## Nigerian Shipping Zones

The API includes predefined shipping zones for Nigeria:
- Lagos & Abuja (1 day)
- South West (2 days)
- South East (3 days)
- South South (3 days)
- North Central (4 days)
- North West (5 days)
- North East (5 days)

## Payment Integration

Flutterwave integration is included for Nigerian payments. The implementation includes:
- Payment initialization
- Payment verification
- Webhook handling
- Order status updates

## Email Notifications

Email notifications are sent for:
- Account verification
- Password reset
- Order confirmation
- Order status updates

## Admin Features

Admin users can:
- Manage products and categories
- View all orders
- Send email notifications
- Access admin-only endpoints

## Security Features

- Password hashing with bcrypt
- JWT token validation
- Rate limiting
- Input validation
- CORS configuration
- Admin role protection

## Testing

Use tools like Postman or curl to test the API endpoints. Example:

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'
```

## Production Deployment

Before deploying to production:

1. Replace mock database with real database
2. Configure real email service
3. Set up proper environment variables
4. Enable HTTPS
5. Configure proper CORS origins
6. Set up monitoring and logging
7. Implement proper error tracking

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License