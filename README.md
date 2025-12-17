# Backend - Landline Shuttle Booking Widget

Node.js/Express backend API for the Landline Shuttle Booking Widget.

## Technology Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Database
- **pg** - PostgreSQL client
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## Features

- RESTful API for routes, schedules, and bookings
- User authentication (signup/signin with JWT)
- Seat level management (1, 2, 3)
- Transaction-based booking with concurrency protection
- Row-level locking to prevent double-booking
- Audit trail for booking modifications

## Project Structure

```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── routes.js         # Route endpoints
│   │   ├── schedules.js      # Schedule and seat endpoints
│   │   └── bookings.js       # Booking endpoints
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── models/
│   │   └── database.js       # Database connection and query methods
│   └── server.js             # Express server setup
├── database/
│   ├── schema.sql            # Database schema
│   ├── seed.sql              # Seed data
│   └── init.js               # Database initialization script
└── package.json
```

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create PostgreSQL database:
   ```bash
   createdb landline
   ```

3. Set environment variables (optional):
   ```bash
   export DB_HOST=localhost
   export DB_PORT=5432
   export DB_NAME=landline
   export DB_USER=postgres
   export DB_PASSWORD=postgres
   export JWT_SECRET=your-secret-key-change-in-production
   export FRONTEND_URL=http://localhost:3000
   ```

4. Initialize database:
   ```bash
   npm run init-db
   ```

5. Start server:
   ```bash
   npm start
   ```

   For development with auto-reload:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/signin` - Sign in user

### Routes
- `GET /api/routes` - Get all routes

### Schedules
- `GET /api/schedules/search` - Search trips (query: origin, destination, date)
- `GET /api/schedules/:id/seats` - Get seats by level
- `GET /api/schedules/:id/availability` - Get availability details

### Bookings
- `GET /api/bookings/my` - Get user's bookings (requires auth)
- `POST /api/bookings` - Create booking
- `PATCH /api/bookings/:id` - Modify booking
- `DELETE /api/bookings/:id` - Cancel booking

## Database

### Schema
- `users` - User authentication
- `routes` - Origin-destination pairs
- `schedules` - Recurring schedules
- `inventory` - Seat availability per date
- `reservations` - Bookings with seat levels
- `booking_modifications` - Audit trail

### Initialization
The `init-db` script:
- Creates all tables
- Runs migrations (adds user_id and seat_level if needed)
- Seeds routes and schedules
- Generates inventory for next 30 days

## Concurrency Handling

Bookings use PostgreSQL transactions with row-level locking:
- `SELECT ... FOR UPDATE` locks inventory rows
- Atomic operations prevent double-booking
- Seat-level validation within transactions
- Automatic rollback on errors

## Authentication

- JWT tokens with 7-day expiration
- Password hashing with bcryptjs (10 rounds)
- Protected routes use `authenticateToken` middleware
- Tokens validated on each protected request

## Seat Levels

Seats are categorized into three levels:
- Level 1: Seats 1-5
- Level 2: Seats 6-10
- Level 3: Seats 11-14

The `/api/schedules/:id/seats` endpoint returns seats grouped by level with availability status.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - Secret key for JWT tokens
- `DB_HOST` - PostgreSQL host (default: localhost)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DB_NAME` - Database name (default: landline)
- `DB_USER` - Database user (default: postgres)
- `DB_PASSWORD` - Database password

## Error Handling

- 400 Bad Request - Invalid input
- 401 Unauthorized - Missing or invalid token
- 403 Forbidden - Invalid token
- 404 Not Found - Resource not found
- 409 Conflict - Seat unavailable or already taken
- 500 Internal Server Error - Server error

## Security

- Parameterized queries prevent SQL injection
- Password hashing with bcryptjs
- JWT token validation
- CORS configuration
- Input validation on all endpoints