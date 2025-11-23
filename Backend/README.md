# TeamBoard Backend API

Team Collaboration Board Application - Backend API built with Node.js, Express, and MongoDB.

## Features

-  JWT-based authentication with secure password hashing (bcrypt)
-  Team management with role-based access control
-  Board and card management (Trello-like)
-  Drag-and-drop card ordering
-  Team reports and analytics
-  Security features: rate limiting, input validation, MongoDB injection protection

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Setup Instructions

1. **Clone the repository**
   ```bash
   cd teamboard-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables**
   Edit `.env` file and set:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key (minimum 32 characters)
   - `SMTP_HOST`: SMTP server host (default: smtp.gmail.com)
   - `SMTP_PORT`: SMTP server port (default: 587)
   - `SMTP_USER`: Your email address for sending OTP emails
   - `SMTP_PASS`: Your email app password (for Gmail, use App Password)
   - `SMTP_FROM`: Sender name and email (e.g., "TeamBoard <your-email@gmail.com>")
   - Other variables as needed

   **Gmail Setup (for OTP emails):**
   1. Enable 2-Step Verification on your Google Account
   2. Go to Google Account → Security → App Passwords
   3. Generate an app password for "Mail"
   4. Use this app password as `SMTP_PASS` in `.env`
   5. Use your Gmail address as `SMTP_USER`

5. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   mongod
   ```

6. **Run the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

7. **Server will run on**
   - Port: `5000` (default)
   - URL: `http://localhost:5000`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `JWT_EXPIRES_IN` | Token expiration time | `15m` |
| `FRONTEND_URL` | Frontend application URL | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `5` |
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP server port | `587` |
| `SMTP_USER` | Email address for sending OTP | Required |
| `SMTP_PASS` | Email app password | Required |
| `SMTP_FROM` | Sender name and email | Optional |

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user (sends OTP to email)
- `POST /api/auth/verify-otp` - Verify OTP and complete registration
- `POST /api/auth/resend-otp` - Resend OTP to email
- `POST /api/auth/login` - Login user

### Teams
- `GET /api/teams` - Get all teams for current user
- `POST /api/teams` - Create a new team
- `GET /api/teams/:teamId` - Get team by ID
- `PUT /api/teams/:teamId` - Update team
- `POST /api/teams/:teamId/invite` - Invite member to team

### Boards
- `POST /api/teams/:teamId/boards` - Create a board
- `GET /api/teams/:teamId/boards` - Get all boards for a team
- `GET /api/boards/:boardId` - Get board by ID with cards
- `PUT /api/boards/:boardId` - Update board
- `POST /api/boards/:boardId/cards/order` - Reorder cards

### Cards
- `POST /api/boards/:boardId/cards` - Create a card
- `PUT /api/cards/:cardId` - Update a card
- `DELETE /api/cards/:cardId` - Delete a card

### Reports
- `GET /api/teams/:teamId/reports/tasks-per-member` - Tasks per team member
- `GET /api/teams/:teamId/reports/near-deadlines` - Tasks due within 3 days
- `GET /api/teams/:teamId/reports/completion-percent` - Task completion percentage

## Seed Script

To populate the database with sample data:

```bash
npm run seed
```

## Testing

Run test scripts:

```bash
npm run test
```

## Project Structure

```
teamboard-backend/
├── src/
│   ├── config/          # Database configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Custom middleware (auth, validation, etc.)
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── .env         # Environment variables
├── .gitignore
├── package.json
└── README.md
```

## Security Features

-  Password hashing with bcrypt (10 salt rounds)
-  JWT authentication with expiry
-  Rate limiting on auth routes
-  Input validation with Zod
-  MongoDB injection protection (express-mongo-sanitize)
-  CORS and Helmet configured
-  Team-level authorization middleware
-  Error handling without stack traces in production

## License

ISC
