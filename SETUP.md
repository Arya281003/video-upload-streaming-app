# Setup Guide

This guide will walk you through setting up the Video Upload, Sensitivity Processing, and Streaming Application from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js** (v18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **MongoDB**
   - **Option A**: Local MongoDB installation
     - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
     - Or use Homebrew: `brew install mongodb-community`
   - **Option B**: MongoDB Atlas (Cloud)
     - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
     - Create a free cluster
     - Get connection string

3. **FFmpeg** (Required for video processing)
   - **Windows**: 
     - Using Chocolatey: `choco install ffmpeg`
     - Or download from [ffmpeg.org](https://ffmpeg.org/download.html)
   - **macOS**: `brew install ffmpeg`
   - **Linux**: `sudo apt-get install ffmpeg`
   - Verify: `ffmpeg -version`

## Step-by-Step Setup

### 1. Clone or Download the Project

If you have the project files, navigate to the project directory:
```bash
cd "Video Upload, Sensitivity Processing, and Streaming Application"
```

### 2. Backend Setup

#### 2.1 Install Dependencies
```bash
cd backend
npm install
```

#### 2.2 Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Important Notes:**
- If using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string
- Change `JWT_SECRET` to a strong, random string (at least 32 characters)
- For production, use a secure secret generator

#### 2.3 Start MongoDB (if using local installation)

**Windows:**
```bash
# If installed as a service, it should start automatically
# Otherwise, start manually:
mongod
```

**macOS:**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

#### 2.4 Start the Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
Connected to MongoDB
Server running on port 5000
```

### 3. Frontend Setup

#### 3.1 Install Dependencies

Open a new terminal window:
```bash
cd frontend
npm install
```

#### 3.2 Start the Development Server

```bash
npm run dev
```

You should see:
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

### 4. Verify Installation

1. Open your browser and navigate to `http://localhost:5173`
2. You should see the login page
3. Click "Register" to create a new account
4. After registration, you'll be logged in automatically

## Testing the Application

### Create Test Users

1. **Viewer Account:**
   - Register with role "Viewer"
   - Can only view completed videos

2. **Editor Account:**
   - Register with role "Editor"
   - Can upload and manage videos

3. **Admin Account:**
   - Register with role "Admin"
   - Full system access

### Test Video Upload

1. Login as Editor or Admin
2. Navigate to "Upload" page
3. Select a video file (test with a small video first)
4. Enter title and category
5. Click "Upload Video"
6. Watch the real-time progress updates
7. Once completed, view the video in the Library

### Test Video Streaming

1. Go to "Library"
2. Find a completed video
3. Click "View"
4. Video should play in the player

## Troubleshooting

### Backend Issues

**MongoDB Connection Error:**
```
Error: MongoDB connection error
```
- Ensure MongoDB is running
- Check connection string in `.env`
- For Atlas, verify network access and credentials

**Port Already in Use:**
```
Error: listen EADDRINUSE: address already in use :::5000
```
- Change `PORT` in `.env` to a different port
- Or stop the process using port 5000

**FFmpeg Not Found:**
```
Error: Cannot find ffmpeg
```
- Install FFmpeg (see Prerequisites)
- Verify installation: `ffmpeg -version`
- Restart the backend server

### Frontend Issues

**Cannot Connect to Backend:**
- Verify backend is running on port 5000
- Check `vite.config.js` proxy settings
- Ensure CORS is configured in backend

**Socket.io Connection Failed:**
- Check that backend Socket.io is running
- Verify `FRONTEND_URL` in backend `.env`
- Check browser console for errors

### Common Solutions

1. **Clear node_modules and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Check file permissions:**
   - Ensure `backend/uploads/` directory is writable
   - Create directories if they don't exist

3. **Verify environment variables:**
   - All required variables are set
   - No typos in variable names
   - Values are properly quoted if needed

## Production Deployment

### Backend Deployment

1. Set environment variables on your hosting platform
2. Use MongoDB Atlas for database
3. Use cloud storage (AWS S3, etc.) for videos
4. Install FFmpeg on the server
5. Set up process manager (PM2, etc.)

### Frontend Deployment

1. Build production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting

3. Update API URLs in production build

## Next Steps

- Review the main [README.md](./README.md) for detailed documentation
- Check [backend/README.md](./backend/README.md) for API details
- Customize video processing logic in `backend/services/videoService.js`
- Integrate real ML/AI services for sensitivity analysis

## Support

If you encounter issues:
1. Check the error messages in console/terminal
2. Verify all prerequisites are installed
3. Review environment variable configuration
4. Check MongoDB and FFmpeg are accessible

