import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';

const VideoUpload = () => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('uncategorized');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState(null);
  const { socket } = useSocket();
  const navigate = useNavigate();

  useEffect(() => {
    if (socket && uploadedVideoId) {
      socket.emit('subscribe-video', uploadedVideoId);

      socket.on('video-progress', (data) => {
        if (data.videoId === uploadedVideoId) {
          setProcessingProgress(data.progress);
          setStatus(data.status);
        }
      });

      socket.on('video-complete', (data) => {
        if (data.videoId === uploadedVideoId) {
          setProcessingProgress(100);
          setStatus('completed');
          setTimeout(() => {
            navigate(`/video/${uploadedVideoId}`);
          }, 2000);
        }
      });

      socket.on('video-error', (data) => {
        if (data.videoId === uploadedVideoId) {
          setError(data.error);
          setStatus('failed');
        }
      });

      return () => {
        socket.off('video-progress');
        socket.off('video-complete');
        socket.off('video-error');
      };
    }
  }, [socket, uploadedVideoId, navigate]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // check file type
      const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please select a valid video file (mp4, avi, mov, wmv, flv, webm, mkv)');
        return;
      }

      // check file size (max 500MB)
      if (selectedFile.size > 500 * 1024 * 1024) {
        setError('File size must be less than 500MB');
        return;
      }

      setFile(selectedFile);
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
      }
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress(0);
    setProcessingProgress(0);
    setStatus('uploading');

    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title || file.name);
    formData.append('category', category);

    try {
      const response = await axios.post('/api/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });

      setUploadedVideoId(response.data.video.id);
      setStatus('processing');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
      setUploading(false);
      setStatus('failed');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Upload Video</h1>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {status === 'completed' && (
          <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            Video processed successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="video" className="block text-sm font-medium text-gray-700 mb-2">
              Video File
            </label>
            <input
              type="file"
              id="video"
              accept="video/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Selected: {file.name} ({formatFileSize(file.size)})
              </p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <input
              type="text"
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={uploading}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {processingProgress > 0 && processingProgress < 100 && (
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Processing Progress: {status}</span>
                <span>{processingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/library')}
              disabled={uploading}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : 'Upload Video'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUpload;

