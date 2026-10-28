'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import api from '@/client/src/api/apiClient';
import { Image as ImageIcon, Send, Sparkles, X, Loader2, Hash } from 'lucide-react';

interface PostComposerProps {
  onPostCreated: (newPost: any) => void;
}

export const PostComposer: React.FC<PostComposerProps> = ({ onPostCreated }) => {
  const { user, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sampleImages = [
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
  ];

  const popularTags = ['fullstack', 'codealpha', 'nodejs', 'react', 'mongodb', 'design'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!content.trim()) {
      error('Please write something before publishing your post.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createPost({
        content: content.trim(),
        image: imageUrl.trim() || undefined,
      });

      if (res.success && res.post) {
        onPostCreated(res.post);
        setContent('');
        setImageUrl('');
        setShowImageInput(false);
        success('Post published to Connectly feed!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to publish post';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    const formatted = `#${tag} `;
    if (!content.includes(formatted.trim())) {
      setContent((prev) => `${prev.trim()} ${formatted}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 transition-shadow hover:shadow-sm">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
            <img
              src={
                user?.avatar ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=96&q=80'
              }
              alt={user?.name || 'User avatar'}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <textarea
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                user
                  ? `What's on your mind, ${user.name.split(' ')[0]}? Share thoughts, code, or ideas...`
                  : 'Log in or sign up to publish a post...'
              }
              className="w-full resize-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-0 focus:ring-0 focus:outline-none p-0 leading-relaxed"
              maxLength={2000}
            />

            {/* Optional Image Input box */}
            {showImageInput && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                  <span className="flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" /> Image Attachment (URL)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageInput(false);
                      setImageUrl('');
                    }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste an image URL (e.g. Unsplash, Cloudinary, Imgur)..."
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-slate-800"
                />

                <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium">
                    <Sparkles className="w-3 h-3 text-indigo-500" /> Preset Samples:
                  </span>
                  {sampleImages.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setImageUrl(url)}
                      className={`h-7 px-2 rounded-md border text-[11px] transition-colors ${
                        imageUrl === url
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      Photo #{idx + 1}
                    </button>
                  ))}
                </div>

                {imageUrl && (
                  <div className="relative mt-2 max-h-48 rounded-lg overflow-hidden border border-slate-200 bg-slate-900">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover max-h-48"
                      onError={() => error('Invalid image URL format')}
                    />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-white rounded-full transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Quick Hashtags */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5 mr-1">
                <Hash className="w-3 h-3" /> Tags:
              </span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-[11px] text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/60 px-2 py-0.5 rounded transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageInput((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    showImageInput || imageUrl
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  aria-label="Add image"
                >
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  <span>Image</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-400">{content.length}/2000</span>
                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Post</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
