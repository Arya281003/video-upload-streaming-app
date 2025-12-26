import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    flagged: 0
  });
  const [recentVideos, setRecentVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentVideos();

    if (socket) {
      socket.on('video-progress', (data) => {
        fetchStats();
        fetchRecentVideos();
      });

      socket.on('video-complete', (data) => {
        fetchStats();
        fetchRecentVideos();
      });
    }

    return () => {
      if (socket) {
        socket.off('video-progress');
        socket.off('video-complete');
      }
    };
  }, [socket]);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/videos');
      const videos = response.data.videos;
      
      setStats({
        total: videos.length,
        processing: videos.filter(v => v.status === 'processing' || v.status === 'uploading').length,
        completed: videos.filter(v => v.status === 'completed').length,
        flagged: videos.filter(v => v.sensitivityStatus === 'flagged').length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchRecentVideos = async () => {
    try {
      const response = await axios.get('/api/videos?sortBy=createdAt&sortOrder=desc');
      setRecentVideos(response.data.videos.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch recent videos:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      uploading: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      flagged: 'bg-orange-100 text-orange-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getSensitivityBadge = (status) => {
    const badges = {
      safe: 'bg-green-100 text-green-800',
      flagged: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          Welcome back, {user?.username}! Here's an overview of your videos.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Videos</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Processing</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Completed</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Flagged</dt>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Videos</h2>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : recentVideos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No videos yet. {(user?.role === 'editor' || user?.role === 'admin') && (
                <Link to="/upload" className="text-indigo-600 hover:text-indigo-500">
                  Upload your first video
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sensitivity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentVideos.map((video) => (
                    <tr key={video._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{video.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(video.status)}`}>
                          {video.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSensitivityBadge(video.sensitivityStatus)}`}>
                          {video.sensitivityStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${video.processingProgress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">{video.processingProgress}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {video.status === 'completed' && (
                          <Link
                            to={`/video/${video._id}`}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            View
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

