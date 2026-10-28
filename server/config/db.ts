import mongoose from 'mongoose';

/**
 * Connect to MongoDB Atlas using Mongoose
 * Reads MONGODB_URI from environment variables
 */
export const connectDB = async (): Promise<typeof mongoose | null> => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri === 'MY_MONGODB_URI') {
    console.warn(
      '⚠️ MONGODB_URI is not set or contains placeholder values. Set MONGODB_URI in your .env file to connect to MongoDB Atlas.'
    );
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    return null;
  }
};

export const isDbConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
