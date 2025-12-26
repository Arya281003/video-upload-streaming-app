import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import Video from '../models/Video.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { enforceTenantIsolation } from '../middleware/multiTenant.js';
import { uploadVideo, processVideo } from '../services/videoService.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
const uploadDir = path.join(__dirname, '../uploads/videos');
const processedDir = path.join(__dirname, '../uploads/processed');
[uploadDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only video files are allowed'));
  }
});

// All video routes require authentication
router.use(authenticate);
router.use(enforceTenantIsolation);

// Upload video
router.post('/upload', authorize('editor', 'admin'), upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No video file provided' });
    }

    const { title, category } = req.body;

    const video = await Video.create({
      title: title || req.file.originalname,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      status: 'uploading',
      uploadedBy: req.user._id,
      organization: req.user.organization,
      category: category || 'uncategorized'
    });

    // Start processing in background
    processVideo(video._id.toString(), req.user._id.toString()).catch(err => {
      console.error('Video processing error:', err);
    });

    res.status(201).json({
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        title: video.title,
        status: video.status,
        processingProgress: video.processingProgress
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading video', error: error.message });
  }
});

// Get all videos (with filtering)
router.get('/', async (req, res) => {
  try {
    const { status, sensitivityStatus, category, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const filter = {
      organization: req.user.organization
    };

    // Apply role-based filtering
    if (req.user.role === 'viewer') {
      // Viewers can only see completed videos
      filter.status = 'completed';
    } else {
      // Editors and admins can see all videos
      if (status) filter.status = status;
    }

    if (sensitivityStatus) filter.sensitivityStatus = sensitivityStatus;
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { originalFilename: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const videos = await Video.find(filter)
      .sort(sort)
      .populate('uploadedBy', 'username email')
      .select('-filePath -processedFilePath');

    res.json({ videos, count: videos.length });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Error fetching videos', error: error.message });
  }
});

// Get single video
router.get('/:id', async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organization: req.user.organization
    }).populate('uploadedBy', 'username email');

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check access permissions
    if (req.user.role === 'viewer' && video.status !== 'completed') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ video });
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ message: 'Error fetching video', error: error.message });
  }
});

// Stream video
router.get('/:id/stream', async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Check if video is ready for streaming
    if (video.status !== 'completed') {
      return res.status(400).json({ message: 'Video is not ready for streaming' });
    }

    const videoPath = video.processedFilePath || video.filePath;
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': video.mimeType || 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': video.mimeType || 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('Stream error:', error);
    res.status(500).json({ message: 'Error streaming video', error: error.message });
  }
});

// Delete video
router.delete('/:id', authorize('editor', 'admin'), async (req, res) => {
  try {
    const video = await Video.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }

    // Delete files
    if (fs.existsSync(video.filePath)) {
      fs.unlinkSync(video.filePath);
    }
    if (video.processedFilePath && fs.existsSync(video.processedFilePath)) {
      fs.unlinkSync(video.processedFilePath);
    }

    await Video.deleteOne({ _id: video._id });

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting video', error: error.message });
  }
});

export default router;

