// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, User, LogOut, Home, PlusSquare, Search } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Service
const api = {
  signup: (username, email, password) =>
    axios.post(`${API_URL}/auth/signup`, { username, email, password }),
  
  login: (email, password) =>
    axios.post(`${API_URL}/auth/login`, { email, password }),
  
  createPost: (token, imageUrl, caption) =>
    axios.post(`${API_URL}/posts`, { imageUrl, caption }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  getFeed: (token) =>
    axios.get(`${API_URL}/posts/feed`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  getUserPosts: (token, userId) =>
    axios.get(`${API_URL}/posts/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  likePost: (token, postId) =>
    axios.post(`${API_URL}/posts/${postId}/like`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  unlikePost: (token, postId) =>
    axios.delete(`${API_URL}/posts/${postId}/like`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  addComment: (token, postId, text) =>
    axios.post(`${API_URL}/posts/${postId}/comments`, { text }, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  followUser: (token, userId) =>
    axios.post(`${API_URL}/users/${userId}/follow`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  unfollowUser: (token, userId) =>
    axios.delete(`${API_URL}/users/${userId}/follow`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  getUser: (token, userId) =>
    axios.get(`${API_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }),
  
  searchUsers: (token, query) =>
    axios.get(`${API_URL}/users/search/${query}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
};

// Components
const LoginScreen = ({ onLogin }) => {
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const response = isSignup 
        ? await api.signup(formData.username, formData.email, formData.password)
        : await api.login(formData.email, formData.password);
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">InstaClone</h1>
        <p className="text-gray-600 text-center mb-6">
          {isSignup ? 'Sign up to see photos from your friends' : 'Sign in to your account'}
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Log In')}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            onClick={() => setIsSignup(!isSignup)}
            className="text-blue-500 hover:underline"
          >
            {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
          <p className="font-semibold mb-2">Demo Accounts:</p>
          <p>Email: jane@example.com | Password: password123</p>
          <p>Email: bob@example.com | Password: password123</p>
        </div>
      </div>
    </div>
  );
};

const PostCard = ({ post, onLike, onComment, onViewProfile }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const handleComment = (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg mb-6">
      <div className="flex items-center p-4">
        <button
          onClick={() => onViewProfile(post.user.id)}
          className="flex items-center hover:opacity-70"
        >
          <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="ml-3 font-semibold">{post.user.username}</span>
        </button>
      </div>

      <img src={post.imageUrl} alt={post.caption} className="w-full object-cover" style={{ maxHeight: '600px' }} />

      <div className="p-4">
        <div className="flex items-center space-x-4 mb-3">
          <button onClick={() => onLike(post.id)} className="hover:opacity-70">
            <Heart size={24} fill={post.isLiked ? '#ef4444' : 'none'} className={post.isLiked ? 'text-red-500' : 'text-black'} />
          </button>
          <button onClick={() => setShowComments(!showComments)} className="hover:opacity-70">
            <MessageCircle size={24} />
          </button>
        </div>

        <div className="font-semibold mb-2">{post.likesCount} likes</div>

        <div className="mb-2">
          <span className="font-semibold mr-2">{post.user.username}</span>
          <span>{post.caption}</span>
        </div>

        {post.comments.length > 0 && !showComments && (
          <button
            onClick={() => setShowComments(true)}
            className="text-gray-500 text-sm mb-2"
          >
            View all {post.comments.length} comments
          </button>
        )}

        {showComments && (
          <div className="space-y-2 mb-3">
            {post.comments.map(comment => (
              <div key={comment.id}>
                <span className="font-semibold mr-2">{comment.user.username}</span>
                <span>{comment.text}</span>
              </div>
            ))}
          </div>
        )}

        <div className="text-gray-400 text-xs mb-3">
          {new Date(post.createdAt).toLocaleDateString()}
        </div>

        <form onSubmit={handleComment} className="flex items-center border-t pt-3">
          <input
            type="text"
            placeholder="Add a comment..."
            className="flex-1 outline-none"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="text-blue-500 font-semibold disabled:text-gray-300"
          >
            Post
          </button>
        </form>
      </div>
    </div>
  );
};

const FeedScreen = ({ token, onViewProfile }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      const response = await api.getFeed(token);
      setPosts(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, [token]);

  const handleLike = async (postId) => {
    const post = posts.find(p => p.id === postId);
    try {
      if (post.isLiked) {
        await api.unlikePost(token, postId);
      } else {
        await api.likePost(token, postId);
      }
      loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  const handleComment = async (postId, text) => {
    try {
      await api.addComment(token, postId, text);
      loadFeed();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading feed...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-xl mb-2">Welcome to InstaClone!</p>
          <p>Follow users to see their posts in your feed.</p>
        </div>
      ) : (
        posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            onLike={handleLike}
            onComment={handleComment}
            onViewProfile={onViewProfile}
          />
        ))
      )}
    </div>
  );
};

const CreatePostScreen = ({ token, onPostCreated }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.createPost(token, imageUrl, caption);
      setImageUrl('');
      setCaption('');
      onPostCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6">Create New Post</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
            />
          </div>

          {imageUrl && (
            <div className="border rounded-lg overflow-hidden">
              <img src={imageUrl} alt="Preview" className="w-full max-h-96 object-cover" />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Caption</label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              rows="3"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !imageUrl || !caption}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? 'Posting...' : 'Share Post'}
          </button>
        </form>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg text-sm">
          <p className="font-semibold mb-2">Sample Image URLs:</p>
          <p className="text-xs break-all mb-1">https://images.unsplash.com/photo-1506905925346-21bda4d32df4</p>
          <p className="text-xs break-all">https://images.unsplash.com/photo-1469474968028-56623f02e42e</p>
        </div>
      </div>
    </div>
  );
};

const ProfileScreen = ({ token, userId, currentUser }) => {
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        api.getUser(token, userId),
        api.getUserPosts(token, userId)
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleFollow = async () => {
    try {
      if (profile.isFollowing) {
        await api.unfollowUser(token, userId);
      } else {
        await api.followUser(token, userId);
      }
      loadProfile();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading profile...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-6">
              <User size={40} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profile.username}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
          
          {!profile.isOwnProfile && (
            <button
              onClick={handleFollow}
              className={`px-6 py-2 rounded-lg font-semibold ${
                profile.isFollowing
                  ? 'bg-gray-200 text-black hover:bg-gray-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {profile.isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
        </div>

        <div className="flex space-x-12">
          <div className="text-center">
            <div className="font-bold text-xl">{profile.posts}</div>
            <div className="text-gray-600">Posts</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl">{profile.followers}</div>
            <div className="text-gray-600">Followers</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-xl">{profile.following}</div>
            <div className="text-gray-600">Following</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {posts.map(post => (
          <div key={post.id} className="aspect-square relative group cursor-pointer">
            <img
              src={post.imageUrl}
              alt={post.caption}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 flex items-center justify-center space-x-6 text-white transition-opacity">
              <div className="flex items-center">
                <Heart size={20} fill="white" />
                <span className="ml-2">{post.likesCount}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle size={20} fill="white" />
                <span className="ml-2">{post.commentsCount}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No posts yet</p>
        </div>
      )}
    </div>
  );
};

const SearchScreen = ({ token, onViewProfile }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.searchUsers(token, searchQuery);
      setResults(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-4">Searching...</div>
        ) : results.length > 0 ? (
          <div className="space-y-3">
            {results.map(user => (
              <button
                key={user.id}
                onClick={() => onViewProfile(user.id)}
                className="flex items-center w-full p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center mr-4">
                  <User size={24} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="font-semibold">{user.username}</div>
                  <div className="text-gray-600 text-sm">{user.email}</div>
                </div>
              </button>
            ))}
          </div>
        ) : query ? (
          <div className="text-center py-4 text-gray-500">No users found</div>
        ) : null}
      </div>
    </div>
  );
};

// Main App
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [currentUser, setCurrentUser] = useState(
    JSON.parse(localStorage.getItem('user') || 'null')
  );
  const [activeScreen, setActiveScreen] = useState('feed');
  const [profileUserId, setProfileUserId] = useState(null);

  const handleLogin = (newToken, user) => {
    setToken(newToken);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setCurrentUser(null);
    setActiveScreen('feed');
  };

  const handleViewProfile = (userId) => {
    setProfileUserId(userId);
    setActiveScreen('profile');
  };

  const handlePostCreated = () => {
    setActiveScreen('feed');
  };

  if (!token) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">InstaClone</h1>
          
          <nav className="flex items-center space-x-6">
            <button
              onClick={() => setActiveScreen('feed')}
              className={`p-2 rounded-lg ${activeScreen === 'feed' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <Home size={24} />
            </button>
            <button
              onClick={() => setActiveScreen('search')}
              className={`p-2 rounded-lg ${activeScreen === 'search' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <Search size={24} />
            </button>
            <button
              onClick={() => setActiveScreen('create')}
              className={`p-2 rounded-lg ${activeScreen === 'create' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <PlusSquare size={24} />
            </button>
            <button
              onClick={() => handleViewProfile(currentUser.id)}
              className={`p-2 rounded-lg ${activeScreen === 'profile' && profileUserId === currentUser.id ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
            >
              <User size={24} />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-gray-50"
            >
              <LogOut size={24} />
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4">
        {activeScreen === 'feed' && (
          <FeedScreen token={token} onViewProfile={handleViewProfile} />
        )}
        {activeScreen === 'create' && (
          <CreatePostScreen token={token} onPostCreated={handlePostCreated} />
        )}
        {activeScreen === 'profile' && (
          <ProfileScreen
            token={token}
            userId={profileUserId}
            currentUser={currentUser}
          />
        )}
        {activeScreen === 'search' && (
          <SearchScreen token={token} onViewProfile={handleViewProfile} />
        )}
      </main>
    </div>
  );
}