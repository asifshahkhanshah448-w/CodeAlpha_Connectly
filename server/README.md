# Connectly Backend — Node.js & Express REST API
**CodeAlpha Full Stack Development Internship — Task 2**

This is the production backend for **Connectly**, built with Express.js, Mongoose, and JWT authentication.

## 📁 Architecture
- `/models`: Mongoose schemas for User, Post, Comment, Like, Follow with compound unique indexes and bcrypt hooks.
- `/controllers`: Business logic with ownership checks and database consistency.
- `/routes`: Modular REST API routing.
- `/middleware`: JWT authentication, token validation, and centralized error handler.
- `/config`: MongoDB Atlas connection handling.

## 🚀 Local Run
```bash
npm install
npm run dev
```

## 🌐 Deploy to Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your repository and set Root Directory to `server`.
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npx ts-node index.ts`
5. Configure Environment Variables in Render:
   - `MONGODB_URI`: Your MongoDB Atlas cluster connection string.
   - `JWT_SECRET`: A secure random string for JWT signing.
   - `CORS_ORIGIN`: Your deployed Vercel frontend URL.
   - `PORT`: `5000` (Render will override as needed).
