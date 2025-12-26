# Quick Start Guide

Get the application running in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js
node --version  # Should be v18+

# Check MongoDB (if using local)
mongod --version  # Or check MongoDB Atlas connection

# Check FFmpeg
ffmpeg -version
```

## Quick Setup

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install:all

# Or separately:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Backend

Create `backend/.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-app
JWT_SECRET=change-this-to-a-random-secret-key-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 3. Start MongoDB

**Local MongoDB:**
```bash
# Windows (if installed as service, starts automatically)
# macOS
brew services start mongodb-community
# Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas** (cloud) - update `MONGODB_URI` in `.env`

### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 5. Access the Application

1. Open browser: `http://localhost:5173`
2. Register a new account (choose Editor or Admin role to upload videos)
3. Login and start uploading videos!

## First Steps

1. **Register** → Create an account with Editor or Admin role
2. **Upload** → Go to Upload page and select a video file
3. **Watch Progress** → See real-time processing updates
4. **View Video** → Once completed, view in Library and stream

## Troubleshooting

**Backend won't start?**
- Check MongoDB is running
- Verify `.env` file exists and has correct values
- Check port 5000 is not in use

**Frontend won't connect?**
- Ensure backend is running on port 5000
- Check browser console for errors

**Video upload fails?**
- Verify FFmpeg is installed: `ffmpeg -version`
- Check file size (max 500MB)
- Ensure file format is supported

## Need Help?

See [SETUP.md](./SETUP.md) for detailed setup instructions.
See [README.md](./README.md) for full documentation.

