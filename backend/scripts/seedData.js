import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Video from '../models/Video.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if test video exists, if not create placeholder
const uploadsDir = path.join(__dirname, '../uploads/videos');
const processedDir = path.join(__dirname, '../uploads/processed');
const testVideoPath = path.join(uploadsDir, 'test-video-sample.mp4');
const testProcessedPath = path.join(processedDir, 'processed-test-video-sample.mp4');

// Ensure directories exist
[uploadsDir, processedDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create a simple placeholder if test video doesn't exist
if (!fs.existsSync(testVideoPath)) {
  const placeholderContent = Buffer.alloc(1024); // 1KB placeholder
  fs.writeFileSync(testVideoPath, placeholderContent);
  fs.writeFileSync(testProcessedPath, placeholderContent);
}

const sampleVideos = [
  {
    title: "Introduction to React Hooks",
    originalFilename: "react-hooks-tutorial.mp4",
    filename: "test-video-sample.mp4",
    filePath: path.join(uploadsDir, 'test-video-sample.mp4'),
    processedFilePath: path.join(processedDir, 'processed-test-video-sample.mp4'),
    fileSize: fs.existsSync(testVideoPath) ? fs.statSync(testVideoPath).size : 15728640,
    duration: 600, // 10 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "safe",
    processingProgress: 100,
    category: "Education",
    metadata: {
      width: 1280,
      height: 720,
      codec: "h264",
      bitrate: 2000000
    }
  },
  {
    title: "MongoDB Database Tutorial",
    originalFilename: "mongodb-tutorial.mp4",
    filename: "sample-mongodb.mp4",
    filePath: "./uploads/videos/sample-mongodb.mp4",
    processedFilePath: "./uploads/processed/sample-mongodb.mp4",
    fileSize: 25165824, // ~24MB
    duration: 1800, // 30 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "safe",
    processingProgress: 100,
    category: "Education",
    metadata: {
      width: 1920,
      height: 1080,
      codec: "h264",
      bitrate: 6000000
    }
  },
  {
    title: "Node.js Express API Development",
    originalFilename: "nodejs-api.mp4",
    filename: "sample-nodejs-api.mp4",
    filePath: "./uploads/videos/sample-nodejs-api.mp4",
    processedFilePath: "./uploads/processed/sample-nodejs-api.mp4",
    fileSize: 31457280, // ~30MB
    duration: 2400, // 40 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "safe",
    processingProgress: 100,
    category: "Technology",
    metadata: {
      width: 1920,
      height: 1080,
      codec: "h264",
      bitrate: 7000000
    }
  },
  {
    title: "JavaScript Fundamentals",
    originalFilename: "javascript-basics.mp4",
    filename: "sample-javascript.mp4",
    filePath: "./uploads/videos/sample-javascript.mp4",
    processedFilePath: "./uploads/processed/sample-javascript.mp4",
    fileSize: 20971520, // ~20MB
    duration: 1500, // 25 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "safe",
    processingProgress: 100,
    category: "Education",
    metadata: {
      width: 1280,
      height: 720,
      codec: "h264",
      bitrate: 4000000
    }
  },
  {
    title: "Video Processing in Progress",
    originalFilename: "processing-video.mp4",
    filename: "sample-processing.mp4",
    filePath: "./uploads/videos/sample-processing.mp4",
    processedFilePath: null,
    fileSize: 36700160, // ~35MB
    duration: null,
    mimeType: "video/mp4",
    status: "processing",
    sensitivityStatus: "pending",
    processingProgress: 65,
    category: "Technology",
    metadata: null
  },
  {
    title: "Flagged Content Review",
    originalFilename: "flagged-content.mp4",
    filename: "sample-flagged.mp4",
    filePath: "./uploads/videos/sample-flagged.mp4",
    processedFilePath: "./uploads/processed/sample-flagged.mp4",
    fileSize: 10485760, // ~10MB
    duration: 600, // 10 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "flagged",
    processingProgress: 100,
    category: "Review",
    metadata: {
      width: 1920,
      height: 1080,
      codec: "h264",
      bitrate: 5000000
    }
  },
  {
    title: "Web Development Best Practices",
    originalFilename: "web-dev-best-practices.mp4",
    filename: "sample-webdev.mp4",
    filePath: "./uploads/videos/sample-webdev.mp4",
    processedFilePath: "./uploads/processed/sample-webdev.mp4",
    fileSize: 41943040, // ~40MB
    duration: 3600, // 60 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "safe",
    processingProgress: 100,
    category: "Education",
    metadata: {
      width: 1920,
      height: 1080,
      codec: "h264",
      bitrate: 8000000
    }
  },
  {
    title: "Docker Containerization Guide",
    originalFilename: "docker-guide.mp4",
    filename: "sample-docker.mp4",
    filePath: "./uploads/videos/sample-docker.mp4",
    processedFilePath: "./uploads/processed/sample-docker.mp4",
    fileSize: 28311552, // ~27MB
    duration: 2100, // 35 minutes
    mimeType: "video/mp4",
    status: "completed",
    sensitivityStatus: "safe",
    processingProgress: 100,
    category: "Technology",
    metadata: {
      width: 1920,
      height: 1080,
      codec: "h264",
      bitrate: 6500000
    }
  }
];

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/video-app';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'aryagupta2810@gmail.com' });
    
    if (!testUser) {
      // Create test user if doesn't exist
      testUser = await User.create({
        username: 'Arya',
        email: 'aryagupta2810@gmail.com',
        password: 'test123456', // You can change this
        role: 'viewer',
        organization: 'default'
      });
      console.log('✅ Created test user: Arya');
    } else {
      console.log('✅ Found existing user: Arya');
    }

    // Clear existing videos for this user
    await Video.deleteMany({ uploadedBy: testUser._id });
    console.log('✅ Cleared existing videos');

    // Create sample videos (convert absolute paths to relative for storage)
    const videosToCreate = sampleVideos.map(video => {
      const videoData = {
        ...video,
        uploadedBy: testUser._id,
        organization: testUser.organization
      };
      // Convert absolute paths to relative paths for database storage
      if (videoData.filePath && path.isAbsolute(videoData.filePath)) {
        videoData.filePath = path.relative(path.join(__dirname, '..'), videoData.filePath);
      }
      if (videoData.processedFilePath && path.isAbsolute(videoData.processedFilePath)) {
        videoData.processedFilePath = path.relative(path.join(__dirname, '..'), videoData.processedFilePath);
      }
      return videoData;
    });

    const createdVideos = await Video.insertMany(videosToCreate);
    console.log(`✅ Created ${createdVideos.length} sample videos`);

    // Display summary
    console.log('\n📊 Sample Data Summary:');
    console.log(`   Total Videos: ${createdVideos.length}`);
    console.log(`   Completed: ${createdVideos.filter(v => v.status === 'completed').length}`);
    console.log(`   Processing: ${createdVideos.filter(v => v.status === 'processing').length}`);
    console.log(`   Safe: ${createdVideos.filter(v => v.sensitivityStatus === 'safe').length}`);
    console.log(`   Flagged: ${createdVideos.filter(v => v.sensitivityStatus === 'flagged').length}`);
    console.log(`   Categories: ${[...new Set(createdVideos.map(v => v.category))].join(', ')}`);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('   Refresh your browser to see the sample videos.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

