# Jotter Backend

A production-ready **Storage Management System** backend built with modern technologies and enterprise-grade security practices.

## Features

### Security
- **JWT Authentication** with access/refresh token rotation
- **HttpOnly Cookies** for refresh tokens (XSS protection)
- **CSRF Protection** via SameSite cookie policy
- **Rate Limiting** (auth: 5/15min, API: 100/15min, uploads: 50/hr)
- **Password Encryption** using bcrypt (12 salt rounds)
- **Input Validation** with Zod and express-validator

### Architecture
- **Clean Architecture** with Service Layer pattern
- **Thin Controllers** - business logic extracted to services
- **Centralized Configuration** - all env vars in single source of truth
- **Custom Error Handling** with ApiError class
- **Structured Logging** with configurable levels

### Core Functionality
- **File Management** - upload, download, organize (images & PDFs)
- **Folder System** - nested folders with cascade delete
- **Notes** - rich text notes with 100KB limit
- **Storage Quota** - 15GB per user with real-time tracking
- **Global Search** - unified search across all content types
- **Favorites & Recent** - quick access to important items
- **Calendar View** - browse items by creation date

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | Node.js 22 |
| Language | TypeScript 5.9 |
| Framework | Express 5 |
| Database | MongoDB 7.0 |
| ODM | Mongoose 9 |
| File Storage | Cloudinary |
| Email | Resend |
| Containerization | Docker |

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker](https://www.docker.com/) (for MongoDB)
- [Cloudinary Account](https://cloudinary.com/) (free tier works)
- [Resend Account](https://resend.com/) (for email)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Kutubuddin-Rasel/Kodevio-Limited.git
cd Kodevio-Limited/backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Required
MONGODB_URI=mongodb://jotter_admin:jotter_secret_2024@localhost:27017/jotter_db?authSource=admin
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
RESEND_API_KEY=re_your_api_key

# Optional (defaults shown)
PORT=5000
NODE_ENV=development
```

### 4. Start MongoDB (Docker)

```bash
npm run docker:up
```

This starts:
- **MongoDB 7.0** on port 27017
- **Mongo Express** (admin UI) on port 8081

### 5. Run the server

```bash
# Development (with hot reload)
npm run dev

# Production
npm run build
npm start
```

## API Routes

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | User registration |
| `POST /api/auth/login` | User login |
| `POST /api/auth/forgot-password` | Request password reset OTP |
| `POST /api/auth/reset-password` | Reset password with OTP |
| `POST /api/auth/refresh-token` | Refresh access token |
| `GET /api/auth/me` | Get current user |
| | |
| `GET /api/files` | List files |
| `POST /api/files/upload` | Upload files (max 10) |
| `DELETE /api/files/:id` | Delete file |
| | |
| `GET /api/folders` | List root folders |
| `POST /api/folders` | Create folder |
| `GET /api/folders/:id/contents` | Get folder contents |
| `DELETE /api/folders/:id` | Delete folder (cascade) |
| | |
| `GET /api/notes` | List notes |
| `POST /api/notes` | Create note |
| `PUT /api/notes/:id` | Update note |
| | |
| `GET /api/storage/stats` | Storage usage stats |
| `GET /api/storage/breakdown` | Storage by type |
| | |
| `GET /api/search?q=...` | Global search |
| `GET /api/favorites` | All favorited items |
| `GET /api/recent` | Recently created items |
| `GET /api/calendar?date=...` | Items by date |

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (env, db, cloudinary)
│   ├── controllers/     # Route handlers (thin)
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routes
│   ├── services/        # Business logic
│   ├── templates/       # Email templates
│   ├── types/           # TypeScript interfaces
│   ├── utils/           # Helpers (ApiError, logger, etc.)
│   ├── validation/      # Zod schemas
│   ├── app.ts           # Express app
│   └── server.ts        # Entry point
├── docker-compose.yml   # MongoDB + Mongo Express
├── Dockerfile           # Production container
└── .env.example         # Environment template
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npm run docker:up` | Start MongoDB containers |
| `npm run docker:down` | Stop MongoDB containers |
| `npm run lint` | Run ESLint |


