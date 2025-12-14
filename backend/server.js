// backend/server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 5000;
const SECRET_KEY = 'your-secret-key-change-in-production';

// Middleware
// Replace the cors line with:
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://your-frontend-url.vercel.app' 
    : 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// In-memory database (replace with MongoDB/PostgreSQL in production)
const db = {
  users: [],
  posts: [],
  follows: [],
  likes: [],
  comments: [],
  nextId: 1
};

// Seed initial data
const seedData = () => {
  const users = [
    { id: 1, username: 'john_doe', email: 'john@example.com', password: bcrypt.hashSync('password123', 10) },
    { id: 2, username: 'jane_smith', email: 'jane@example.com', password: bcrypt.hashSync('password123', 10) },
    { id: 3, username: 'bob_wilson', email: 'bob@example.com', password: bcrypt.hashSync('password123', 10) }
  ];
  
  db.users.push(...users);
  db.nextId = 4;

  db.posts.push(
    { id: 101, userId: 2, imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4', caption: 'Mountain adventure! 🏔️', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 102, userId: 3, imageUrl: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e', caption: 'Coffee time ☕', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 103, userId: 2, imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e', caption: 'Nature walks 🌲', createdAt: new Date(Date.now() - 10800000).toISOString() }
  );

  db.follows.push(
    { id: 201, followerId: 1, followingId: 2 },
    { id: 202, followerId: 1, followingId: 3 }
  );

  db.likes.push({ id: 301, userId: 1, postId: 101 });
  db.comments.push({ id: 401, postId: 101, userId: 1, text: 'Amazing view!', createdAt: new Date().toISOString() });
};

seedData();

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.userId = verified.userId;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Routes

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (db.users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: db.nextId++,
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '24h' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '24h' });
    res.json({
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post Routes
app.post('/api/posts', authenticateToken, (req, res) => {
  try {
    const { imageUrl, caption } = req.body;
    const post = {
      id: db.nextId++,
      userId: req.userId,
      imageUrl,
      caption,
      createdAt: new Date().toISOString()
    };

    db.posts.unshift(post);
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/feed', authenticateToken, (req, res) => {
  try {
    const following = db.follows.filter(f => f.followerId === req.userId).map(f => f.followingId);
    following.push(req.userId);

    const feedPosts = db.posts.filter(p => following.includes(p.userId));

    const enrichedPosts = feedPosts.map(post => {
      const user = db.users.find(u => u.id === post.userId);
      const likes = db.likes.filter(l => l.postId === post.id);
      const comments = db.comments.filter(c => c.postId === post.id).map(c => ({
        ...c,
        user: db.users.find(u => u.id === c.userId)
      }));

      return {
        ...post,
        user: { id: user.id, username: user.username, email: user.email },
        likesCount: likes.length,
        isLiked: likes.some(l => l.userId === req.userId),
        comments: comments.map(c => ({
          ...c,
          user: { id: c.user.id, username: c.user.username }
        }))
      };
    });

    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/posts/user/:userId', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const userPosts = db.posts.filter(p => p.userId === targetUserId);

    const enrichedPosts = userPosts.map(post => {
      const likes = db.likes.filter(l => l.postId === post.id);
      const comments = db.comments.filter(c => c.postId === post.id);

      return {
        ...post,
        likesCount: likes.length,
        isLiked: likes.some(l => l.userId === req.userId),
        commentsCount: comments.length
      };
    });

    res.json(enrichedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like Routes
app.post('/api/posts/:postId/like', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);

    const existing = db.likes.find(l => l.userId === req.userId && l.postId === postId);
    if (existing) {
      return res.status(400).json({ error: 'Already liked' });
    }

    db.likes.push({ id: db.nextId++, userId: req.userId, postId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/posts/:postId/like', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);

    const idx = db.likes.findIndex(l => l.userId === req.userId && l.postId === postId);
    if (idx === -1) {
      return res.status(400).json({ error: 'Not liked' });
    }

    db.likes.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment Routes
app.post('/api/posts/:postId/comments', authenticateToken, (req, res) => {
  try {
    const postId = parseInt(req.params.postId);
    const { text } = req.body;

    const comment = {
      id: db.nextId++,
      postId,
      userId: req.userId,
      text,
      createdAt: new Date().toISOString()
    };

    db.comments.push(comment);

    const user = db.users.find(u => u.id === req.userId);
    res.json({
      ...comment,
      user: { id: user.id, username: user.username }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Follow Routes
app.post('/api/users/:userId/follow', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    if (req.userId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existing = db.follows.find(f => f.followerId === req.userId && f.followingId === targetUserId);
    if (existing) {
      return res.status(400).json({ error: 'Already following' });
    }

    db.follows.push({ id: db.nextId++, followerId: req.userId, followingId: targetUserId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:userId/follow', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);

    const idx = db.follows.findIndex(f => f.followerId === req.userId && f.followingId === targetUserId);
    if (idx === -1) {
      return res.status(400).json({ error: 'Not following' });
    }

    db.follows.splice(idx, 1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Routes
app.get('/api/users/:userId', authenticateToken, (req, res) => {
  try {
    const targetUserId = parseInt(req.params.userId);
    const user = db.users.find(u => u.id === targetUserId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = db.follows.filter(f => f.followingId === targetUserId).length;
    const following = db.follows.filter(f => f.followerId === targetUserId).length;
    const isFollowing = db.follows.some(f => f.followerId === req.userId && f.followingId === targetUserId);
    const posts = db.posts.filter(p => p.userId === targetUserId).length;

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      followers,
      following,
      posts,
      isFollowing,
      isOwnProfile: req.userId === targetUserId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/search/:query', authenticateToken, (req, res) => {
  try {
    const query = req.params.query.toLowerCase();
    const results = db.users
      .filter(u => u.username.toLowerCase().includes(query) && u.id !== req.userId)
      .map(u => ({ id: u.id, username: u.username, email: u.email }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});