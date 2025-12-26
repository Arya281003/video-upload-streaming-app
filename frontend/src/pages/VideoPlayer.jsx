import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  useEffect(() => {
    fetchVideo();
  }, [id]);

  const fetchVideo = async () => {
    try {
      const response = await axios.get(`/api/videos/${id}`);
      setVideo(response.data.video);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      await axios.delete(`/api/videos/${id}`);
      navigate('/library');
    } catch (err) {
      alert('Failed to delete video');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading video...</div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Video not found'}
        </div>
        <button
          onClick={() => navigate('/library')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (video.status !== 'completed') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          Video is still processing. Please wait for processing to complete.
        </div>
        <button
          onClick={() => navigate('/library')}
          className="text-indigo-600 hover:text-indigo-500"
        >
          Back to Library
        </button>
      </div>
    );
  }

  const videoUrl = `/api/videos/${id}/stream`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{video.title}</h1>
        <button
          onClick={() => navigate('/library')}
          className="text-gray-600 hover:text-gray-900"
        >
          ← Back to Library
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="aspect-video bg-black">
          <video
            ref={videoRef}
            controls
            className="w-full h-full"
            src={videoUrl}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Video Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">Status:</span>
            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              video.status === 'completed' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {video.status}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Sensitivity:</span>
            <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
              video.sensitivityStatus === 'safe' 
                ? 'bg-green-100 text-green-800' 
                : video.sensitivityStatus === 'flagged'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {video.sensitivityStatus}
            </span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">File Size:</span>
            <span className="ml-2 text-sm text-gray-900">{formatFileSize(video.fileSize)}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Duration:</span>
            <span className="ml-2 text-sm text-gray-900">{formatDuration(video.duration)}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Category:</span>
            <span className="ml-2 text-sm text-gray-900">{video.category}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">Uploaded:</span>
            <span className="ml-2 text-sm text-gray-900">{formatDate(video.createdAt)}</span>
          </div>
          {video.metadata && (
            <>
              <div>
                <span className="text-sm font-medium text-gray-500">Resolution:</span>
                <span className="ml-2 text-sm text-gray-900">
                  {video.metadata.width} x {video.metadata.height}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Codec:</span>
                <span className="ml-2 text-sm text-gray-900">{video.metadata.codec || 'N/A'}</span>
              </div>
            </>
          )}
        </div>

        {(user?.role === 'editor' || user?.role === 'admin') && (
          <div className="mt-6 pt-6 border-t">
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Delete Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;

