'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import api from '@/client/src/api/apiClient';
import { formatRelativeTime } from '@/lib/utils';
import { CommentSection } from './CommentSection';
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  Maximize2,
} from 'lucide-react';

export interface PostType {
  id: string;
  _id: string;
  content: string;
  image?: string;
  likesCount: number;
  commentsCount: number;
  tags?: string[];
  createdAt: string;
  isLiked?: boolean;
  isAuthor?: boolean;
  author: {
    id?: string;
    _id?: string;
    name: string;
    username: string;
    avatar: string;
    bio?: string;
  };
}

interface PostCardProps {
  post: PostType;
  onPostDeleted?: (postId: string) => void;
  onOpenProfile?: (username: string) => void;
}

export const PostCard: React.FC<PostCardProps> = ({ post, onPostDeleted, onOpenProfile }) => {
  const { user, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [isLiked, setIsLiked] = useState(Boolean(post.isLiked));
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  // Edit post state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [currentContent, setCurrentContent] = useState(post.content);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Image lightbox zoom state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const author = post.author;
  const authorId = author?._id || author?.id;
  const isPostOwner =
    user && (authorId === user._id || authorId === user.id || post.isAuthor);

  const handleLikeToggle = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (isLikeLoading) return;
    setIsLikeLoading(true);

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    const newLiked = !isLiked;
    const newCount = newLiked ? likesCount + 1 : Math.max(0, likesCount - 1);
    setIsLiked(newLiked);
    setLikesCount(newCount);

    try {
      const res = newLiked ? await api.likePost(post._id || post.id) : await api.unlikePost(post._id || post.id);
      if (res.success) {
        setLikesCount(res.likesCount);
        setIsLiked(res.isLiked);
      }
    } catch (err: unknown) {
      // Revert on failure
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      const msg = err instanceof Error ? err.message : 'Error updating like';
      error(msg);
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const res = await api.deletePost(post._id || post.id);
      if (res.success) {
        success('Post deleted successfully.');
        if (onPostDeleted) onPostDeleted(post._id || post.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete post';
      error(msg);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) {
      error('Post content cannot be empty.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await api.updatePost(post._id || post.id, { content: editContent.trim() });
      if (res.success) {
        setCurrentContent(editContent.trim());
        setIsEditing(false);
        success('Post updated!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update post';
      error(msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    success('Post link copied to clipboard!');
  };


  // Render text with styled hashtags
  const renderFormattedContent = (text: string) => {
    const parts = text.split(/(#[a-zA-Z0-9_]+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('#')) {
        return (
          <span key={i} className="text-indigo-600 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <>
      <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 transition-shadow hover:shadow-sm">
        {/* Author Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenProfile && author && onOpenProfile(author.username)}
              className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 hover:opacity-90 transition-opacity"
            >
              <img
                src={
                  author?.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${author?.username || 'user'}`
                }
                alt={author?.name || 'User'}
                className="w-full h-full object-cover"
              />
            </button>

            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenProfile && author && onOpenProfile(author.username)}
                  className="font-bold text-sm text-slate-900 hover:text-indigo-600 transition-colors"
                >
                  {author?.name || 'Anonymous User'}
                </button>
                <span className="text-xs text-slate-400">@{author?.username}</span>
                <span className="text-slate-300 text-xs" aria-hidden="true">
                  ·
                </span>
                <time className="text-xs text-slate-500">{formatRelativeTime(post.createdAt)}</time>
              </div>

              {author?.bio && (
                <p className="text-[11px] text-slate-500 line-clamp-1 max-w-md hidden sm:block">
                  {author.bio}
                </p>
              )}
            </div>
          </div>

          {/* Options Dropdown Menu for Author */}
          {isPostOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowMenu((prev) => !prev)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-20 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1 text-xs animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      handleDelete();
                    }}
                    className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="mt-3 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                rows={3}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white text-slate-800"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(currentContent);
                  }}
                  className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 border rounded-lg"
                >
                  <X className="w-3.5 h-3.5 inline mr-1" /> Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </div>
            </div>
          ) : (
            renderFormattedContent(currentContent)
          )}
        </div>

        {/* Post Image */}
        {post.image && (
          <div className="mt-3.5 relative rounded-xl overflow-hidden border border-slate-200/80 bg-slate-900 group">
            <img
              src={post.image}
              alt="Post attachment"
              className="w-full max-h-[460px] object-cover cursor-pointer transition-transform duration-200 group-hover:scale-[1.01]"
              onClick={() => setIsLightboxOpen(true)}
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(true)}
              className="absolute bottom-3 right-3 p-1.5 bg-black/60 hover:bg-black text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs"
              title="Expand image"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Counters Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            {/* Like */}
            <button
              type="button"
              onClick={handleLikeToggle}
              className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors ${
                isLiked
                  ? 'text-rose-600 bg-rose-50/70 font-semibold'
                  : 'hover:text-rose-600 hover:bg-rose-50/50'
              }`}
              title={isLiked ? 'Unlike' : 'Like'}
              aria-label="Like post"
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  isLiked ? 'fill-rose-600 text-rose-600 scale-110' : ''
                }`}
              />
              <span>{likesCount}</span>
            </button>

            {/* Comment Toggle */}
            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className={`flex items-center gap-1.5 py-1 px-2 rounded-lg transition-colors ${
                showComments
                  ? 'text-indigo-600 bg-indigo-50 font-semibold'
                  : 'hover:text-indigo-600 hover:bg-slate-100'
              }`}
              title="Comments"
              aria-label="Toggle comments"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{commentsCount}</span>
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Share post"
              aria-label="Share post"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <CommentSection
            postId={post._id || post.id}
            onCommentCountChange={(newCount) => setCommentsCount(newCount)}
            onOpenProfile={onOpenProfile}
          />
        )}
      </article>

      {/* Lightbox Modal */}
      {isLightboxOpen && post.image && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={post.image}
              alt="Full view"
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white transition-colors"
              aria-label="Close image preview"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
