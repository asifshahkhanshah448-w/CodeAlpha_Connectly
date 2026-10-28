import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectToDatabase, getDbStatus } from './db';
import { User } from '../server/models/User';
import { Post } from '../server/models/Post';
import { Comment } from '../server/models/Comment';
import { Like } from '../server/models/Like';
import { Follow } from '../server/models/Follow';

const JWT_SECRET = process.env.JWT_SECRET || 'connectly_jwt_secret_dev_2026';

// ============================================================================
// IN-MEMORY DOCUMENT STORE (Fallback when MongoDB Atlas credentials are not yet entered)
// ============================================================================
interface MemUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  bio: string;
  avatar: string;
  location?: string;
  website?: string;
  postsCount: number;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

interface MemPost {
  _id: string;
  author: MemUser;
  content: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  tags: string[];
  createdAt: string;
}

interface MemComment {
  _id: string;
  post: string;
  author: MemUser;
  content: string;
  createdAt: string;
}

interface MemLike {
  _id: string;
  user: string;
  post: string;
  createdAt: string;
}

interface MemFollow {
  _id: string;
  follower: string;
  following: string;
  createdAt: string;
}

// Pre-seeded starter users for immediate internship demo exploration
const initialHashedPassword = bcrypt.hashSync('Password123!', 10);

const memUsers: MemUser[] = [
  {
    _id: 'usr_sarah_001',
    username: 'sarah_chen',
    email: 'sarah@connectly.dev',
    password: initialHashedPassword,
    name: 'Sarah Chen',
    bio: 'Senior Distributed Systems Architect | Building scalable cloud applications & open source contributor.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    location: 'San Francisco, CA',
    website: 'https://sarahchen.dev',
    postsCount: 2,
    followersCount: 142,
    followingCount: 89,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    _id: 'usr_marcus_002',
    username: 'marcus_dev',
    email: 'marcus@connectly.dev',
    password: initialHashedPassword,
    name: 'Marcus Vance',
    bio: 'Full-stack engineer & UI craftsperson. TypeScript, Node.js, Next.js & MongoDB fanatic.',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    location: 'Austin, TX',
    website: 'https://marcus.design',
    postsCount: 1,
    followersCount: 310,
    followingCount: 112,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    _id: 'usr_elena_003',
    username: 'elena_rostova',
    email: 'elena@connectly.dev',
    password: initialHashedPassword,
    name: 'Elena Rostova',
    bio: 'Product Designer at TechFlow. Designing human-centric social experiences & design systems.',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    location: 'Seattle, WA',
    website: 'https://elena.design',
    postsCount: 1,
    followersCount: 520,
    followingCount: 140,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const memPosts: MemPost[] = [
  {
    _id: 'post_001',
    author: memUsers[0],
    content:
      'Excited to announce the launch of Connectly! Built with a clean Express backend, modular REST architecture, and Mongoose schemas. Seamless pagination, nested comments, and atomic like/follow counters are all live. Check out the clean light UI! #fullstack #codealpha #nodejs',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    likesCount: 24,
    commentsCount: 2,
    tags: ['fullstack', 'codealpha', 'nodejs'],
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    _id: 'post_002',
    author: memUsers[1],
    content:
      'Designing social media feeds requires deep attention to typographic contrast, responsive grids, and zero-pill metadata discipline. Crisp lines, subtle shadows, and intentional indigo accents make content shine. #design #webdev #frontend',
    image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    likesCount: 18,
    commentsCount: 1,
    tags: ['design', 'webdev', 'frontend'],
    createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    _id: 'post_003',
    author: memUsers[2],
    content:
      'Tip for full stack developers: Always enforce unique indexes at the database level for relationships like Likes and Follows. It prevents race conditions and ensures data integrity regardless of concurrent requests! #mongodb #bestpractices',
    image: '',
    likesCount: 37,
    commentsCount: 0,
    tags: ['mongodb', 'bestpractices'],
    createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
  },
];

const memComments: MemComment[] = [
  {
    _id: 'comment_001',
    post: 'post_001',
    author: memUsers[1],
    content: 'Brilliant work Sarah! The responsiveness and clean aesthetics are top tier.',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: 'comment_002',
    post: 'post_001',
    author: memUsers[2],
    content: 'Love the subtle indigo accents and clear feed hierarchy. Great job!',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    _id: 'comment_003',
    post: 'post_002',
    author: memUsers[0],
    content: 'Totally agree on the zero-pill discipline. Clean typographic separators look so much more professional.',
    createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
];

const memLikes: MemLike[] = [
  { _id: 'like_001', user: memUsers[1]._id, post: 'post_001', createdAt: new Date().toISOString() },
  { _id: 'like_002', user: memUsers[2]._id, post: 'post_001', createdAt: new Date().toISOString() },
  { _id: 'like_003', user: memUsers[0]._id, post: 'post_002', createdAt: new Date().toISOString() },
];

const memFollows: MemFollow[] = [
  { _id: 'fol_001', follower: memUsers[0]._id, following: memUsers[1]._id, createdAt: new Date().toISOString() },
  { _id: 'fol_002', follower: memUsers[1]._id, following: memUsers[0]._id, createdAt: new Date().toISOString() },
  { _id: 'fol_003', follower: memUsers[2]._id, following: memUsers[0]._id, createdAt: new Date().toISOString() },
];

export const generateJWT = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });
};

export const verifyJWT = (token: string): string | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    return decoded.id;
  } catch {
    return null;
  }
};

// ============================================================================
// UNIFIED DATA ACCESS LAYER (Switches dynamically between Atlas and Local)
// ============================================================================

export const dataStore = {
  async isUsingAtlas() {
    const status = getDbStatus();
    if (!status.connected && status.uriConfigured) {
      await connectToDatabase();
    }
    return mongoose.connection.readyState === 1;
  },

  // --- AUTH ---
  async register(data: {
    username: string;
    email: string;
    password: string;
    name: string;
    bio?: string;
    avatar?: string;
    location?: string;
    website?: string;
  }) {
    const usingAtlas = await this.isUsingAtlas();

    if (usingAtlas) {
      const existing = await User.findOne({
        $or: [{ email: data.email.toLowerCase() }, { username: data.username.toLowerCase() }],
      });
      if (existing) {
        throw new Error(
          existing.email === data.email.toLowerCase()
            ? 'An account with this email address already exists.'
            : 'This username is already taken. Please choose another.'
        );
      }

      const defaultAvatar =
        data.avatar ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.username)}`;

      const user = await User.create({
        ...data,
        username: data.username.toLowerCase(),
        email: data.email.toLowerCase(),
        avatar: defaultAvatar,
      });

      const token = generateJWT(user._id.toString());
      return { token, user: user.toObject() };
    }

    // In-memory store execution
    const usernameClean = data.username.toLowerCase().trim();
    const emailClean = data.email.toLowerCase().trim();

    if (memUsers.some((u) => u.email === emailClean)) {
      throw new Error('An account with this email address already exists.');
    }
    if (memUsers.some((u) => u.username === usernameClean)) {
      throw new Error('This username is already taken. Please choose another.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const defaultAvatar =
      data.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(usernameClean)}`;

    const newUser: MemUser = {
      _id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: usernameClean,
      email: emailClean,
      password: hashedPassword,
      name: data.name.trim(),
      bio: (data.bio || '').trim(),
      avatar: defaultAvatar,
      location: data.location || '',
      website: data.website || '',
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date().toISOString(),
    };

    memUsers.push(newUser);
    const token = generateJWT(newUser._id);
    const { password: _, ...userSafe } = newUser;
    return { token, user: userSafe };
  },

  async login(identifier: string, passwordPlain: string) {
    const usingAtlas = await this.isUsingAtlas();

    if (usingAtlas) {
      const query = identifier.includes('@')
        ? { email: identifier.toLowerCase().trim() }
        : { username: identifier.toLowerCase().trim() };
      const user = await User.findOne(query).select('+password');
      if (!user) {
        throw new Error('User not found. Check your username or email.');
      }
      const match = await user.matchPassword(passwordPlain);
      if (!match) {
        throw new Error('Incorrect password. Please try again.');
      }
      const token = generateJWT(user._id.toString());
      const userObj = user.toObject();
      delete userObj.password;
      return { token, user: userObj };
    }

    const cleanId = identifier.toLowerCase().trim();
    const user = memUsers.find(
      (u) => u.email.toLowerCase() === cleanId || u.username.toLowerCase() === cleanId
    );
    if (!user) {
      throw new Error('User not found with those credentials.');
    }

    const match = await bcrypt.compare(passwordPlain, user.password || '');
    if (!match) {
      throw new Error('Incorrect password. Please try again.');
    }

    const token = generateJWT(user._id);
    const { password: _, ...userSafe } = user;
    return { token, user: userSafe };
  },

  async getUserById(id: string) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const u = await User.findById(id).select('-password');
      return u ? u.toObject() : null;
    }
    const u = memUsers.find((x) => x._id === id);
    if (!u) return null;
    const { password: _, ...userSafe } = u;
    return userSafe;
  },

  async getUserByUsername(username: string, currentUserId?: string | null) {
    const usingAtlas = await this.isUsingAtlas();
    const cleanUsername = username.toLowerCase().trim();

    if (usingAtlas) {
      const user = await User.findOne({ username: cleanUsername });
      if (!user) return null;

      const [postsCount, followersCount, followingCount, userPosts] = await Promise.all([
        Post.countDocuments({ author: user._id }),
        Follow.countDocuments({ following: user._id }),
        Follow.countDocuments({ follower: user._id }),
        Post.find({ author: user._id }).sort({ createdAt: -1 }).populate('author').lean(),
      ]);

      let isFollowing = false;
      if (currentUserId && currentUserId !== user._id.toString()) {
        const f = await Follow.findOne({ follower: currentUserId, following: user._id });
        isFollowing = !!f;
      }

      return {
        user: {
          ...user.toObject(),
          postsCount,
          followersCount,
          followingCount,
          isFollowing,
          isSelf: currentUserId === user._id.toString(),
        },
        posts: userPosts,
      };
    }

    const user = memUsers.find((u) => u.username.toLowerCase() === cleanUsername);
    if (!user) return null;

    const userPosts = memPosts.filter((p) => p.author._id === user._id);
    const followers = memFollows.filter((f) => f.following === user._id);
    const following = memFollows.filter((f) => f.follower === user._id);

    const isFollowing = currentUserId
      ? memFollows.some((f) => f.follower === currentUserId && f.following === user._id)
      : false;

    const { password: _, ...userSafe } = user;
    return {
      user: {
        ...userSafe,
        postsCount: userPosts.length,
        followersCount: followers.length,
        followingCount: following.length,
        isFollowing,
        isSelf: currentUserId === user._id,
      },
      posts: userPosts,
    };
  },

  async updateProfile(userId: string, data: Partial<MemUser>) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const u = await User.findByIdAndUpdate(
        userId,
        {
          ...(data.name && { name: data.name }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.avatar && { avatar: data.avatar }),
          ...(data.location !== undefined && { location: data.location }),
          ...(data.website !== undefined && { website: data.website }),
        },
        { new: true }
      ).select('-password');
      return u ? u.toObject() : null;
    }

    const idx = memUsers.findIndex((u) => u._id === userId);
    if (idx === -1) throw new Error('User not found');
    memUsers[idx] = {
      ...memUsers[idx],
      ...data,
      name: data.name || memUsers[idx].name,
      bio: data.bio !== undefined ? data.bio : memUsers[idx].bio,
      avatar: data.avatar || memUsers[idx].avatar,
    };
    const { password: _, ...userSafe } = memUsers[idx];
    return userSafe;
  },

  async discoverUsers(currentUserId?: string | null) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      let excludeIds: any[] = [];
      if (currentUserId) {
        const follows = await Follow.find({ follower: currentUserId }).select('following');
        excludeIds = [currentUserId, ...follows.map((f) => f.following)];
      }
      return await User.find({ _id: { $nin: excludeIds } })
        .limit(6)
        .select('name username avatar bio followersCount followingCount postsCount')
        .lean();
    }

    let followingIds = new Set<string>();
    if (currentUserId) {
      followingIds = new Set(
        memFollows.filter((f) => f.follower === currentUserId).map((f) => f.following)
      );
    }

    return memUsers
      .filter((u) => u._id !== currentUserId && !followingIds.has(u._id))
      .slice(0, 6)
      .map(({ password: _, ...safe }) => safe);
  },

  async searchUsers(query: string) {
    const clean = query.toLowerCase().trim();
    if (!clean) return [];

    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const regex = new RegExp(clean, 'i');
      return await User.find({ $or: [{ username: regex }, { name: regex }] })
        .limit(8)
        .select('name username avatar bio followersCount')
        .lean();
    }

    return memUsers
      .filter((u) => u.username.toLowerCase().includes(clean) || u.name.toLowerCase().includes(clean))
      .slice(0, 8)
      .map(({ password: _, ...safe }) => safe);
  },

  // --- POSTS ---
  async getFeed(params: {
    page?: number;
    limit?: number;
    tab?: string;
    tag?: string;
    currentUserId?: string | null;
  }) {
    const { page = 1, limit = 10, tab = 'all', tag, currentUserId } = params;
    const usingAtlas = await this.isUsingAtlas();

    if (usingAtlas) {
      const skip = (page - 1) * limit;
      const query: Record<string, unknown> = {};
      if (tag) query.tags = tag.toLowerCase();

      if (tab === 'following' && currentUserId) {
        const follows = await Follow.find({ follower: currentUserId }).select('following');
        const ids = follows.map((f) => f.following);
        query.author = { $in: [...ids, currentUserId] };
      }

      const [posts, totalPosts] = await Promise.all([
        Post.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('author', 'name username avatar bio')
          .lean(),
        Post.countDocuments(query),
      ]);

      let userLikes = new Set<string>();
      if (currentUserId && posts.length > 0) {
        const likes = await Like.find({
          user: currentUserId,
          post: { $in: posts.map((p) => p._id) },
        }).select('post');
        userLikes = new Set(likes.map((l) => l.post.toString()));
      }

      const formatted = posts.map((p) => ({
        ...p,
        id: p._id.toString(),
        isLiked: userLikes.has(p._id.toString()),
        isAuthor: currentUserId ? (p.author as any)?._id?.toString() === currentUserId : false,
      }));

      return {
        posts: formatted,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages: Math.ceil(totalPosts / limit),
          hasMore: skip + posts.length < totalPosts,
        },
      };
    }

    // In-memory feed
    let filtered = [...memPosts];

    if (tag) {
      filtered = filtered.filter((p) => p.tags.includes(tag.toLowerCase()));
    }

    if (tab === 'following' && currentUserId) {
      const followingIds = new Set(
        memFollows.filter((f) => f.follower === currentUserId).map((f) => f.following)
      );
      followingIds.add(currentUserId);
      filtered = filtered.filter((p) => followingIds.has(p.author._id));
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalPosts = filtered.length;
    const skip = (page - 1) * limit;
    const paginated = filtered.slice(skip, skip + limit);

    const formatted = paginated.map((p) => {
      const isLiked = currentUserId
        ? memLikes.some((l) => l.user === currentUserId && l.post === p._id)
        : false;
      const isAuthor = currentUserId === p.author._id;
      return {
        ...p,
        id: p._id,
        isLiked,
        isAuthor,
      };
    });

    return {
      posts: formatted,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        hasMore: skip + paginated.length < totalPosts,
      },
    };
  },

  async createPost(userId: string, content: string, image?: string) {
    const usingAtlas = await this.isUsingAtlas();

    const tags = (content.match(/#[a-zA-Z0-9_]+/g) || []).map((t) =>
      t.substring(1).toLowerCase()
    );

    if (usingAtlas) {
      const post = await Post.create({
        author: userId,
        content: content.trim(),
        image: image || '',
        tags: Array.from(new Set(tags)),
      });
      await User.findByIdAndUpdate(userId, { $inc: { postsCount: 1 } });
      await post.populate('author', 'name username avatar');
      return { ...post.toObject(), id: post._id.toString(), isLiked: false, isAuthor: true };
    }

    const user = memUsers.find((u) => u._id === userId);
    if (!user) throw new Error('User not found');

    const newPost: MemPost = {
      _id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author: user,
      content: content.trim(),
      image: image || '',
      likesCount: 0,
      commentsCount: 0,
      tags: Array.from(new Set(tags)),
      createdAt: new Date().toISOString(),
    };

    memPosts.unshift(newPost);
    user.postsCount += 1;

    return {
      ...newPost,
      id: newPost._id,
      isLiked: false,
      isAuthor: true,
    };
  },

  async deletePost(postId: string, userId: string) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const p = await Post.findById(postId);
      if (!p) throw new Error('Post not found');
      if (p.author.toString() !== userId) throw new Error('Forbidden: Not post author');
      await Promise.all([
        Post.findByIdAndDelete(postId),
        Like.deleteMany({ post: postId }),
        Comment.deleteMany({ post: postId }),
        User.findByIdAndUpdate(userId, { $inc: { postsCount: -1 } }),
      ]);
      return true;
    }

    const pIdx = memPosts.findIndex((p) => p._id === postId);
    if (pIdx === -1) throw new Error('Post not found');
    if (memPosts[pIdx].author._id !== userId) throw new Error('Forbidden: Not post author');

    memPosts.splice(pIdx, 1);
    const u = memUsers.find((x) => x._id === userId);
    if (u && u.postsCount > 0) u.postsCount -= 1;

    // Clean comments & likes
    for (let i = memComments.length - 1; i >= 0; i--) {
      if (memComments[i].post === postId) memComments.splice(i, 1);
    }
    for (let i = memLikes.length - 1; i >= 0; i--) {
      if (memLikes[i].post === postId) memLikes.splice(i, 1);
    }

    return true;
  },

  async updatePost(postId: string, userId: string, content: string, image?: string) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const p = await Post.findById(postId);
      if (!p) throw new Error('Post not found');
      if (p.author.toString() !== userId) throw new Error('Forbidden: Not post author');
      p.content = content.trim();
      if (image !== undefined) p.image = image.trim();
      await p.save();
      await p.populate('author', 'name username avatar');
      return p.toObject();
    }

    const post = memPosts.find((p) => p._id === postId);
    if (!post) throw new Error('Post not found');
    if (post.author._id !== userId) throw new Error('Forbidden: Not post author');
    post.content = content.trim();
    if (image !== undefined) post.image = image.trim();
    return post;
  },

  // --- LIKES ---
  async toggleLike(postId: string, userId: string) {
    const usingAtlas = await this.isUsingAtlas();

    if (usingAtlas) {
      const existing = await Like.findOne({ user: userId, post: postId });
      if (existing) {
        await Like.findByIdAndDelete(existing._id);
        const p = await Post.findByIdAndUpdate(
          postId,
          { $inc: { likesCount: -1 } },
          { new: true }
        );
        return { isLiked: false, likesCount: Math.max(0, p?.likesCount || 0) };
      } else {
        await Like.create({ user: userId, post: postId });
        const p = await Post.findByIdAndUpdate(
          postId,
          { $inc: { likesCount: 1 } },
          { new: true }
        );
        return { isLiked: true, likesCount: p?.likesCount || 1 };
      }
    }

    const post = memPosts.find((p) => p._id === postId);
    if (!post) throw new Error('Post not found');

    const lIdx = memLikes.findIndex((l) => l.user === userId && l.post === postId);
    if (lIdx !== -1) {
      memLikes.splice(lIdx, 1);
      post.likesCount = Math.max(0, post.likesCount - 1);
      return { isLiked: false, likesCount: post.likesCount };
    } else {
      memLikes.push({
        _id: `like_${Date.now()}`,
        user: userId,
        post: postId,
        createdAt: new Date().toISOString(),
      });
      post.likesCount += 1;
      return { isLiked: true, likesCount: post.likesCount };
    }
  },

  // --- COMMENTS ---
  async getComments(postId: string, currentUserId?: string | null) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const comments = await Comment.find({ post: postId })
        .sort({ createdAt: 1 })
        .populate('author', 'name username avatar')
        .lean();
      return comments.map((c) => ({
        ...c,
        id: c._id.toString(),
        isAuthor: currentUserId ? (c.author as any)?._id?.toString() === currentUserId : false,
      }));
    }

    const comments = memComments.filter((c) => c.post === postId);
    comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return comments.map((c) => ({
      ...c,
      id: c._id,
      isAuthor: currentUserId === c.author._id,
    }));
  },

  async addComment(postId: string, userId: string, content: string) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const comment = await Comment.create({
        post: postId,
        author: userId,
        content: content.trim(),
      });
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } });
      await comment.populate('author', 'name username avatar');
      return {
        ...comment.toObject(),
        id: comment._id.toString(),
        isAuthor: true,
      };
    }

    const post = memPosts.find((p) => p._id === postId);
    if (!post) throw new Error('Post not found');

    const user = memUsers.find((u) => u._id === userId);
    if (!user) throw new Error('User not found');

    const newComment: MemComment = {
      _id: `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      post: postId,
      author: user,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    memComments.push(newComment);
    post.commentsCount += 1;

    return {
      ...newComment,
      id: newComment._id,
      isAuthor: true,
    };
  },

  async deleteComment(commentId: string, userId: string) {
    const usingAtlas = await this.isUsingAtlas();
    if (usingAtlas) {
      const comment = await Comment.findById(commentId);
      if (!comment) throw new Error('Comment not found');
      if (comment.author.toString() !== userId) throw new Error('Forbidden: Not comment author');
      const postId = comment.post;
      await Comment.findByIdAndDelete(commentId);
      await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: -1 } });
      return true;
    }

    const cIdx = memComments.findIndex((c) => c._id === commentId);
    if (cIdx === -1) throw new Error('Comment not found');
    if (memComments[cIdx].author._id !== userId) throw new Error('Forbidden: Not comment author');

    const postId = memComments[cIdx].post;
    memComments.splice(cIdx, 1);

    const post = memPosts.find((p) => p._id === postId);
    if (post && post.commentsCount > 0) post.commentsCount -= 1;

    return true;
  },

  // --- FOLLOWS ---
  async toggleFollow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new Error('You cannot follow yourself.');
    }

    const usingAtlas = await this.isUsingAtlas();

    if (usingAtlas) {
      const existing = await Follow.findOne({ follower: followerId, following: followingId });
      if (existing) {
        await Follow.findByIdAndDelete(existing._id);
        const [targetUser, currentUser] = await Promise.all([
          User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } }, { new: true }),
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } }, { new: true }),
        ]);
        return {
          isFollowing: false,
          targetFollowersCount: Math.max(0, targetUser?.followersCount || 0),
          currentUserFollowingCount: Math.max(0, currentUser?.followingCount || 0),
        };
      } else {
        await Follow.create({ follower: followerId, following: followingId });
        const [targetUser, currentUser] = await Promise.all([
          User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } }, { new: true }),
          User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } }, { new: true }),
        ]);
        return {
          isFollowing: true,
          targetFollowersCount: targetUser?.followersCount || 1,
          currentUserFollowingCount: currentUser?.followingCount || 1,
        };
      }
    }

    const targetUser = memUsers.find((u) => u._id === followingId);
    const currentUser = memUsers.find((u) => u._id === followerId);
    if (!targetUser || !currentUser) throw new Error('User not found');

    const fIdx = memFollows.findIndex(
      (f) => f.follower === followerId && f.following === followingId
    );

    if (fIdx !== -1) {
      memFollows.splice(fIdx, 1);
      targetUser.followersCount = Math.max(0, targetUser.followersCount - 1);
      currentUser.followingCount = Math.max(0, currentUser.followingCount - 1);
      return {
        isFollowing: false,
        targetFollowersCount: targetUser.followersCount,
        currentUserFollowingCount: currentUser.followingCount,
      };
    } else {
      memFollows.push({
        _id: `fol_${Date.now()}`,
        follower: followerId,
        following: followingId,
        createdAt: new Date().toISOString(),
      });
      targetUser.followersCount += 1;
      currentUser.followingCount += 1;
      return {
        isFollowing: true,
        targetFollowersCount: targetUser.followersCount,
        currentUserFollowingCount: currentUser.followingCount,
      };
    }
  },
};
