import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB Atlas
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Connectly Express Server running on port ${PORT}`);
    console.log(`📡 Health check available at: http://localhost:${PORT}/api/health`);
  });
});
