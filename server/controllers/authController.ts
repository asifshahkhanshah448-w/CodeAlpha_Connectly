import { Request, Response } from 'express';
import { User } from '../models/User';
import { generateToken, AuthRequest } from '../middleware/auth';

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, name, bio, avatar, location, website } = req.body;

    if (!username || !email || !password || !name) {
      res.status(400).json({
        success: false,
        message: 'Please provide username, email, password, and display name.',
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }],
    });

    if (existingUser) {
      const matchEmail = existingUser.email === email.toLowerCase();
      res.status(400).json({
        success: false,
        message: matchEmail
          ? 'An account with this email address already exists.'
          : 'This username is already taken. Please choose another.',
      });
      return;
    }

    const defaultAvatar =
      avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`;

    const user = await User.create({
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password,
      name,
      bio: bio || '',
      avatar: defaultAvatar,
      location: location || '',
      website: website || '',
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        location: user.location,
        website: user.website,
        postsCount: user.postsCount,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error during registration.',
    });
  }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide your email/username and password.',
      });
      return;
    }

    const query = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: identifier.toLowerCase() };

    const user = await User.findOne(query).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
      return;
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        email: user.email,
        name: user.name,
        bio: user.bio,
        avatar: user.avatar,
        location: user.location,
        website: user.website,
        postsCount: user.postsCount,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        createdAt: user.createdAt,
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Server error during login.',
    });
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Error fetching user profile',
    });
  }
};

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Public
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};
