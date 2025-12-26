# Backend API Documentation

## Overview

The backend is built with Node.js, Express, MongoDB, and Socket.io. It provides RESTful APIs for video management, user authentication, and real-time progress updates.

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication

#### POST /api/auth/register
Register a new user.

**Request Body:**
```json
{
  "username": "string (min 3 chars)",
  "email": "string (valid email)",
  "password": "string (min 6 chars)",
  "role": "viewer | editor | admin (optional, default: viewer)",
  "organization": "string (optional, default: 'default')"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "JWT token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "role": "string",
    "organization": "string"
  }
}
```

#### POST /api/auth/login
Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "JWT token",
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "role": "string",
    "organization": "string"
  }
}
```

#### GET /api/auth/me
Get current authenticated user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "user_id",
    "username": "string",
    "email": "string",
    "role": "string",
    "organization": "string"
  }
}
```

### Videos

All video endpoints require authentication.

#### POST /api/videos/upload
Upload a new video file. Requires Editor or Admin role.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Body (FormData):**
- `video`: File (max 500MB, supported: mp4, avi, mov, wmv, flv, webm, mkv)
- `title`: string (optional, defaults to filename)
- `category`: string (optional, defaults to 'uncategorized')

**Response:**
```json
{
  "message": "Video uploaded successfully",
  "video": {
    "id": "video_id",
    "title": "string",
    "status": "uploading",
    "processingProgress": 0
  }
}
```

#### GET /api/videos
Get list of videos with optional filtering.

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: string (uploading, processing, completed, failed)
- `sensitivityStatus`: string (safe, flagged, pending)
- `category`: string
- `search`: string (searches in title and filename)
- `sortBy`: string (default: createdAt)
- `sortOrder`: string (asc | desc, default: desc)

**Response:**
```json
{
  "videos": [
    {
      "_id": "video_id",
      "title": "string",
      "status": "string",
      "sensitivityStatus": "string",
      "processingProgress": 0-100,
      "fileSize": 0,
      "category": "string",
      "createdAt": "ISO date",
      "uploadedBy": {
        "_id": "user_id",
        "username": "string",
        "email": "string"
      }
    }
  ],
  "count": 0
}
```

#### GET /api/videos/:id
Get single video details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "video": {
    "_id": "video_id",
    "title": "string",
    "filename": "string",
    "status": "string",
    "sensitivityStatus": "string",
    "processingProgress": 0-100,
    "fileSize": 0,
    "duration": 0,
    "category": "string",
    "metadata": {
      "width": 0,
      "height": 0,
      "codec": "string",
      "bitrate": 0
    },
    "createdAt": "ISO date",
    "uploadedBy": {
      "_id": "user_id",
      "username": "string",
      "email": "string"
    }
  }
}
```

#### GET /api/videos/:id/stream
Stream video with HTTP range request support.

**Headers:**
```
Authorization: Bearer <token>
Range: bytes=start-end (optional)
```

**Response:**
- Video stream with proper Content-Range headers
- Supports partial content requests for efficient streaming

#### DELETE /api/videos/:id
Delete a video. Requires Editor or Admin role.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Video deleted successfully"
}
```

## Socket.io Events

### Client → Server

#### Authentication
Socket.io connections require JWT token in handshake:
```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

#### subscribe-video
Subscribe to video progress updates.
```javascript
socket.emit('subscribe-video', videoId);
```

#### unsubscribe-video
Unsubscribe from video updates.
```javascript
socket.emit('unsubscribe-video', videoId);
```

### Server → Client

#### video-progress
Real-time processing progress update.
```javascript
socket.on('video-progress', (data) => {
  // data: {
  //   videoId: string,
  //   progress: number (0-100),
  //   status: string
  // }
});
```

#### video-complete
Video processing completed.
```javascript
socket.on('video-complete', (data) => {
  // data: {
  //   videoId: string,
  //   progress: 100,
  //   status: 'completed',
  //   sensitivityStatus: 'safe' | 'flagged'
  // }
});
```

#### video-error
Video processing error occurred.
```javascript
socket.on('video-error', (data) => {
  // data: {
  //   videoId: string,
  //   error: string
  // }
});
```

## Role-Based Access Control

### Viewer Role
- Can view completed videos only
- Read-only access
- Cannot upload or delete videos

### Editor Role
- Can upload videos
- Can view all videos (including processing ones)
- Can delete own videos
- Cannot manage users

### Admin Role
- Full access to all features
- Can manage users
- Can delete any video
- System-wide access

## Multi-Tenant Architecture

Users are automatically isolated by their `organization` field. Each user can only access videos from their own organization, ensuring complete data segregation.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

## Video Processing Pipeline

1. **Upload**: File is saved to `uploads/videos/`
2. **Validation**: File type and size validation
3. **Metadata Extraction**: FFmpeg extracts video metadata
4. **Sensitivity Analysis**: Content analysis (currently simulated)
5. **Processing**: Video prepared for streaming
6. **Completion**: Status updated, ready for streaming

Processing progress is broadcast in real-time via Socket.io.

