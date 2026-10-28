# Connectly Client — React + Vite Social Media Frontend
**CodeAlpha Full Stack Development Internship — Task 2**

This is the modern React + Vite frontend for **Connectly**.

## 🚀 Features
- **User Authentication**: Secure JWT sign-in & registration with input validation.
- **User Profiles**: Dynamic statistics (Posts, Followers, Following count), bio, avatar, and edit profile modal.
- **Posts & Comments**: Create posts with text and images, real-time comment threads, and owner deletion/editing.
- **Atomic Likes & Follows**: Instant optimistic UI updates with database consistency.
- **Centralized API Client**: Communicates with backend using `VITE_API_BASE_URL`.

## 🌐 Deploy to Vercel
1. Import this repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client` (or root if using Next.js).
3. Set **Framework Preset**: Vite.
4. Set **Build Command**: `npm run build`.
5. Set **Output Directory**: `dist`.
6. Set Environment Variable in Vercel:
   - `VITE_API_BASE_URL`: The URL of your deployed Render backend (e.g. `https://connectly-api.onrender.com/api`).
