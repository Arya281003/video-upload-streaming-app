# Video Upload and Streaming App

A full-stack web application for uploading videos, checking if they're safe or flagged, and streaming them. Built with Node.js, Express, MongoDB, and React.

## Features

- Upload videos (mp4, avi, mov, etc.)
- Check if videos are safe or flagged
- Real-time progress updates while processing
- Stream videos after processing
- User roles: Viewer (can only watch), Editor (can upload), Admin (full access)
- Filter and search videos
- Dashboard to see all videos and stats

## Tech Stack

**Backend:**
- Node.js + Express
- MongoDB
- Socket.io (for real-time updates)
- JWT for authentication
- Multer for file uploads
- FFmpeg for video processing

**Frontend:**
- React
- Vite
- Tailwind CSS
- Axios
- Socket.io client

## Project Structure

```
.
├── backend/
│   ├── models/
│   │   ├── User.js          # User model with RBAC
│   │   └── Video.js          # Video model with metadata
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   └── videos.js         # Video management routes
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication middleware
│   │   └── multiTenant.js    # Multi-tenant isolation
│   ├── services/
│   │   └── videoService.js   # Video processing logic
│   ├── socket/
│   │   └── socket.js          # Socket.io configuration
│   ├── uploads/              # Video storage (gitignored)
│   ├── server.js             # Express server setup
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── context/          # React Context providers
│   │   ├── pages/            # Page components
│   │   ├── App.jsx           # Main app component
│   │   └── main.jsx          # Entry point
│   ├── index.html
│   └── package.json
│
└── README.md
```

## Setup

**Requirements:**
- Node.js (v18+)
- MongoDB (local or MongoDB Atlas)
- FFmpeg

#### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Or download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

4. Start the backend server:
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### User Registration & Login

1. Navigate to `http://localhost:5173/register`
2. Create an account with:
   - Username
   - Email
   - Password
   - Role (Viewer, Editor, or Admin)
3. Login at `http://localhost:5173/login`

### Video Upload (Editor/Admin Only)

1. Navigate to the Upload page
2. Select a video file (max 500MB, supported formats: mp4, avi, mov, wmv, flv, webm, mkv)
3. Enter a title and optional category
4. Click "Upload Video"
5. Monitor real-time processing progress

### Video Library

- View all uploaded videos
- Filter by status, sensitivity, category, or search by title
- View processing progress in real-time
- Access completed videos for streaming

### Video Streaming

- Click "View" on any completed video
- Video player supports HTTP range requests for efficient streaming
- View video metadata and details

## API Documentation

### Authentication Endpoints

#### Register User
```
POST /api/auth/register
Body: {
  username: string,
  email: string,
  password: string,
  role?: 'viewer' | 'editor' | 'admin',
  organization?: string
}
```

#### Login
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}
```

#### Get Current User
```
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Video Endpoints

#### Upload Video
```
POST /api/videos/upload
Headers: Authorization: Bearer <token>
Body: FormData {
  video: File,
  title: string,
  category?: string
}
```

#### Get All Videos
```
GET /api/videos?status=completed&sensitivityStatus=safe&category=uncategorized&search=keyword
Headers: Authorization: Bearer <token>
```

#### Get Single Video
```
GET /api/videos/:id
Headers: Authorization: Bearer <token>
```

#### Stream Video
```
GET /api/videos/:id/stream
Headers: Authorization: Bearer <token>
Range: bytes=start-end (optional)
```

#### Delete Video
```
DELETE /api/videos/:id
Headers: Authorization: Bearer <token>
```

## Real-Time Events (Socket.io)

### Client → Server
- `subscribe-video`: Subscribe to video progress updates
- `unsubscribe-video`: Unsubscribe from video updates

### Server → Client
- `video-progress`: Real-time processing progress updates
  ```javascript
  {
    videoId: string,
    progress: number (0-100),
    status: string
  }
  ```
- `video-complete`: Video processing completed
  ```javascript
  {
    videoId: string,
    progress: 100,
    status: 'completed',
    sensitivityStatus: 'safe' | 'flagged'
  }
  ```
- `video-error`: Video processing error
  ```javascript
  {
    videoId: string,
    error: string
  }
  ```

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Multi-tenant data isolation
- File upload validation
- Secure video streaming with authentication

## Development Notes

### Video Processing
The current implementation uses a simulated sensitivity analysis. In production, you would integrate with:
- Machine Learning models for content analysis
- Cloud-based video processing services
- Custom computer vision algorithms

### File Storage
Videos are stored locally in `backend/uploads/`. For production, consider:
- Cloud storage (AWS S3, Google Cloud Storage)
- CDN integration for streaming
- Video transcoding for multiple quality levels

### Database
MongoDB is used for metadata storage. Ensure:
- Proper indexing for performance
- Regular backups
- Connection pooling for scalability

## Deployment

### Backend Deployment
1. Set environment variables on your hosting platform
2. Ensure MongoDB is accessible (MongoDB Atlas recommended)
3. Install FFmpeg on the server
4. Set up proper file storage (cloud storage recommended)

### Frontend Deployment
1. Build the production bundle:
```bash
cd frontend
npm run build
```
2. Deploy the `dist` folder to:
   - Vercel
   - Netlify
   - AWS S3 + CloudFront
   - Any static hosting service

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access if using MongoDB Atlas

2. **FFmpeg Not Found**
   - Install FFmpeg on your system
   - Ensure it's in your system PATH
   - Restart the server after installation

3. **Video Upload Fails**
   - Check file size (max 500MB)
   - Verify file format is supported
   - Ensure upload directory has write permissions

4. **Socket.io Connection Issues**
   - Verify CORS settings in backend
   - Check that frontend URL matches `FRONTEND_URL` in `.env`
   - Ensure authentication token is valid

## License

This project is created for educational purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions, please open an issue on the GitHub repository.

