# Quick Start

How to run the app

## Setup Steps

### 1. Install dependencies

```bash
# Install all dependencies
npm run install:all

# Or separately:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Create .env file

Create `backend/.env` with:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-app
JWT_SECRET=change-this-to-a-random-secret-key-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

Make sure MongoDB is running (local or Atlas)

### 4. Start backend

```bash
cd backend
npm run dev
```

### 5. Start frontend (new terminal)

```bash
cd frontend
npm run dev
```

### 6. Open browser

Go to `http://localhost:5173`

Register an account and start using!

