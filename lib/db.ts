import mongoose from 'mongoose';

let isConnected = false;
let connectionAttempted = false;
let connectionError: string | null = null;

export const connectToDatabase = async (): Promise<{
  connected: boolean;
  isAtlas: boolean;
  error?: string | null;
}> => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.includes('<username>') || uri.includes('MY_MONGODB_URI')) {
    connectionAttempted = true;
    connectionError =
      'MONGODB_URI is not configured in .env. Please provide a valid MongoDB Atlas connection string.';
    return {
      connected: false,
      isAtlas: false,
      error: connectionError,
    };
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return { connected: true, isAtlas: true };
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      autoIndex: true,
    });
    isConnected = true;
    connectionAttempted = true;
    connectionError = null;
    console.log(`✅ Connected to MongoDB Atlas: ${conn.connection.host}`);
    return { connected: true, isAtlas: true };
  } catch (error) {
    isConnected = false;
    connectionAttempted = true;
    connectionError = error instanceof Error ? error.message : 'Unknown MongoDB connection error';
    console.warn('⚠️ Could not connect to MongoDB Atlas:', connectionError);
    return {
      connected: false,
      isAtlas: false,
      error: connectionError,
    };
  }
};

export const getDbStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    connected: readyState === 1,
    readyState,
    connectionAttempted,
    error: connectionError,
    uriConfigured:
      Boolean(process.env.MONGODB_URI) &&
      !process.env.MONGODB_URI?.includes('<username>') &&
      !process.env.MONGODB_URI?.includes('MY_MONGODB_URI'),
  };
};
