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

// check if video is safe or flagged (just random for now)
const analyzeSensitivity = async (videoPath) => {
  // wait a bit to simulate processing
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // randomly decide if flagged (20% chance)
  const isFlagged = Math.random() < 0.2;
  
  return {
    sensitivityStatus: isFlagged ? 'flagged' : 'safe',
    confidence: Math.random() * 0.3 + 0.7
  };
};

// get video info using ffmpeg
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

// process video - check sensitivity and prepare for streaming
export const processVideo = async (videoId, userId) => {
  try {
    const video = await Video.findById(videoId);
    if (!video) {
      throw new Error('Video not found');
    }

    // start processing
    video.status = 'processing';
    video.processingProgress = 10;
    await video.save();

    // send progress update
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-progress', {
        videoId: video._id.toString(),
        progress: 10,
        status: 'processing'
      });
    }

    // get video info
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
      console.error('Error getting video metadata:', err);
    }

    // check sensitivity
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

    // copy to processed folder
    const processedDir = path.join(__dirname, '../uploads/processed');
    if (!fs.existsSync(processedDir)) {
      fs.mkdirSync(processedDir, { recursive: true });
    }

    const processedFileName = `processed-${video.filename}`;
    const processedPath = path.join(processedDir, processedFileName);

    // copy file
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

    // done!
    video.status = 'completed';
    video.processingProgress = 100;
    await video.save();

    // send completion message
    if (ioInstance) {
      ioInstance.to(`user-${userId}`).emit('video-complete', {
        videoId: video._id.toString(),
        progress: 100,
        status: 'completed',
        sensitivityStatus: video.sensitivityStatus
      });
    }

    console.log('Video processed:', videoId);
  } catch (error) {
    console.error('Error processing video:', error);
    
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

