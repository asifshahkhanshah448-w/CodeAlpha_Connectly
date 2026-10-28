'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import api from '@/client/src/api/apiClient';
import { formatRelativeTime } from '@/lib/utils';
import { Trash2, Send, Loader2 } from 'lucide-react';

interface Comment {
  id: string;
  _id: string;
  content: string;
  createdAt: string;
  isAuthor?: boolean;
  author: {
    _id?: string;
    id?: string;
    name: string;
    username: string;
    avatar: string;
  };
}

interface CommentSectionProps {
  postId: string;
  onCommentCountChange?: (count: number) => void;
  onOpenProfile?: (username: string) => void;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  onCommentCountChange,
  onOpenProfile,
}) => {
  const { user, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .getComments(postId)
      .then((res) => {
        if (isMounted && res.success) {
          setComments(res.comments);
          if (onCommentCountChange) onCommentCountChange(res.comments.length);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [postId, onCommentCountChange]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.addComment(postId, newComment.trim());
      if (res.success && res.comment) {
        setComments((prev) => [...prev, res.comment]);
        setNewComment('');
        if (onCommentCountChange) onCommentCountChange(comments.length + 1);
        success('Comment posted!');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to post comment';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      const res = await api.deleteComment(commentId);
      if (res.success) {
        setComments((prev) => prev.filter((c) => c._id !== commentId && c.id !== commentId));
        if (onCommentCountChange) onCommentCountChange(Math.max(0, comments.length - 1));
        success('Comment deleted.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete comment';
      error(msg);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'recently';
    }
  };

  return (
    <div className="pt-4 border-t border-slate-100 space-y-4">
      {/* Input */}
      <form onSubmit={handleAddComment} className="flex items-start gap-2.5">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
          <img
            src={
              user?.avatar ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80'
            }
            alt="Your avatar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 relative">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={user ? 'Write a comment...' : 'Log in to join the conversation'}
            className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all text-slate-800"
          />
          <button
            type="submit"
            disabled={isSubmitting || !newComment.trim()}
            className="absolute right-1.5 top-1.5 p-1 text-indigo-600 hover:text-indigo-700 disabled:text-slate-300 transition-colors"
            title="Post comment"
            aria-label="Post comment"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* List */}
      {isLoading ? (
        <div className="py-3 flex justify-center text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> Loading comments...
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-4 text-xs text-slate-400">
          No comments yet. Start the conversation!
        </div>
      ) : (
        <div className="space-y-3 pt-1">
          {comments.map((comment) => {
            const author = comment.author;
            const authorId = author?._id || author?.id;
            const isCommentOwner =
              user && (authorId === user._id || authorId === user.id || comment.isAuthor);

            return (
              <div key={comment._id || comment.id} className="flex items-start gap-2.5 text-xs">
                <button
                  type="button"
                  onClick={() => onOpenProfile && author && onOpenProfile(author.username)}
                  className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 shrink-0 hover:opacity-90 transition-opacity"
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

                <div className="flex-1 bg-slate-50/80 rounded-xl px-3 py-2 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onOpenProfile && author && onOpenProfile(author.username)}
                        className="font-semibold text-slate-900 hover:underline"
                      >
                        {author?.name || 'User'}
                      </button>
                      <span className="text-slate-400" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-400 text-[11px]">
                        {formatTime(comment.createdAt)}
                      </span>
                    </div>

                    {isCommentOwner && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment._id || comment.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete comment"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="mt-1 text-slate-700 text-xs leading-relaxed break-words whitespace-pre-wrap">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
