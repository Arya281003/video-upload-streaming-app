import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  filename: {
    type: String,
    required: true
  },
  originalFilename: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  processedFilePath: {
    type: String
  },
  fileSize: {
    type: Number,
    required: true
  },
  duration: {
    type: Number
  },
  mimeType: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['uploading', 'processing', 'completed', 'failed', 'flagged'],
    default: 'uploading'
  },
  sensitivityStatus: {
    type: String,
    enum: ['safe', 'flagged', 'pending'],
    default: 'pending'
  },
  processingProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'uncategorized'
  },
  metadata: {
    width: Number,
    height: Number,
    codec: String,
    bitrate: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
videoSchema.index({ uploadedBy: 1, organization: 1 });
videoSchema.index({ status: 1, sensitivityStatus: 1 });
videoSchema.index({ createdAt: -1 });

export default mongoose.model('Video', videoSchema);

