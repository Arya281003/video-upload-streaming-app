import Video from '../models/Video.js';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

let ioInstance = null;

export const setIOInstance = (io) => {
  ioInstance = io;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simulate sensitivity analysis (in production, use actual ML/AI service)
const analyzeSensitivity = async (videoPath) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Random classification for demo (replace with actual analysis)
  const isFlagged = Math.random() < 0.2; // 20% chance of being flagged
  
  return {
    sensitivityStatus: isFlagged ? 'flagged' : 'safe',
    confidence: Math.random() * 0.3 + 0.7 // 70-100% confidence
  };
};

// Get video metadata using ffmpeg
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }

      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      const audioStream = metadata.streams.find(stream => stream.codec_type === 'audio');

      resolve({
        duration: metadata.format.duration,
        width: videoStream?.width,
        height: videoStream?.height,
        codec: videoStream?.codec_name,
        bitrate: metadata.format.bit_rate,
        hasAudio: !!audioStream
      });
    });
  });
};

// Process video: analyze sensitivity and prepare for streaming
export const processVideo = async (videoId, userId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // Update status to processing
    video.status = 'processing';
    video.processingProgress = 10;
    await video.save();

    // Emit progress update
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-progress', {
      videoId: video._id.toString(),
      progress: 10,
      status: 'processing'
      });
    }

    // Get video metadata
    try {
      const metadata = await getVideoMetadata(video.filePath);
      video.duration = metadata.duration;
      video.metadata = {
        width: metadata.width,
        height: metadata.height,
        codec: metadata.codec,
        bitrate: metadata.bitrate
      };
      video.processingProgress = 30;
      await video.save();

      if (ioInstance) {
        ioInstance.to(`user-${userId}`).emit('video-progress', {
          videoId: video._id.toString(),
          progress: 30,
          status: 'processing'
        });
      }
    } catch (err) {
      console.error('Metadata extraction error:', err);
    }

    // Perform sensitivity analysis
    video.processingProgress = 50;
    await video.save();

    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-progress', {
        videoId: video._id.toString(),
        progress: 50,
        status: 'analyzing'
      });
    }

    const analysisResult = await analyzeSensitivity(video.filePath);
    video.sensitivityStatus = analysisResult.sensitivityStatus;
    video.processingProgress = 70;
    await video.save();

    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-progress', {
        videoId: video._id.toString(),
        progress: 70,
        status: 'processing'
      });
    }

    // Prepare video for streaming (copy to processed directory)
    const processedDir = path.join(__dirname, '../uploads/processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const processedFileName = `processed-${video.filename}`;
    const processedPath = path.join(processedDir, processedFileName);

    // Copy file to processed directory (in production, you might transcode/optimize here)
    fs.copyFileSync(video.filePath, processedPath);
    video.processedFilePath = processedPath;
    video.processingProgress = 90;
    await video.save();

    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-progress', {
        videoId: video._id.toString(),
        progress: 90,
        status: 'finalizing'
      });
    }

    // Mark as completed
    video.status = 'completed';
    video.processingProgress = 100;
    await video.save();

    // Emit completion
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-complete', {
        videoId: video._id.toString(),
        progress: 100,
        status: 'completed',
        sensitivityStatus: video.sensitivityStatus
      });
    }

    console.log(`Video ${videoId} processed successfully`);
  } catch (error) {
    console.error('Video processing error:', error);
    
    const video = await Video.findById(videoId);
    if (video) {
      video.status = 'failed';
      await video.save();

      if (ioInstance) {
        ioInstance.to(`user-${userId}`).emit('video-error', {
          videoId: video._id.toString(),
          error: error.message
        });
      }
    }
  }
};

export const uploadVideo = async (file, metadata) => {
  // This function can be extended for additional upload logic
  return { success: true };
};

