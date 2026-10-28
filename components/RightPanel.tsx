'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import api from '@/client/src/api/apiClient';
import { Database, Sparkles, TrendingUp, UserPlus, UserCheck, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface RightPanelProps {
  onOpenProfile: (username: string) => void;
  onSelectTag?: (tag: string) => void;
  activeTag?: string | null;
  onOpenDatabaseGuide: () => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  onOpenProfile,
  onSelectTag,
  activeTag,
  onOpenDatabaseGuide,
}) => {
  const { user, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [discoverUsers, setDiscoverUsers] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;
    api
      .discoverUsers()
      .then((res) => {
        if (isMounted && res.success && res.users) {
          setDiscoverUsers(res.users);
        }
      })
      .catch(() => {});

    api
      .checkHealth()
      .then((res) => {
        if (isMounted) {
          setDbConnected(Boolean(res.databaseConnected));
        }
      })
      .catch(() => {
        if (isMounted) setDbConnected(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFollowToggle = async (targetId: string, username: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    setLoadingMap((prev) => ({ ...prev, [targetId]: true }));
    const isCurrentlyFollowing = Boolean(followingMap[targetId]);

    try {
      const res = isCurrentlyFollowing
        ? await api.unfollowUser(targetId)
        : await api.followUser(targetId);

      if (res.success) {
        setFollowingMap((prev) => ({ ...prev, [targetId]: res.isFollowing }));
        success(res.isFollowing ? `Now following @${username}!` : `Unfollowed @${username}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating follow status';
      error(msg);
    } finally {
      setLoadingMap((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const trendingTopics = [
    { tag: 'fullstack', postsCount: 142 },
    { tag: 'codealpha', postsCount: 98 },
    { tag: 'mongodb', postsCount: 84 },
    { tag: 'nodejs', postsCount: 65 },
    { tag: 'design', postsCount: 52 },
    { tag: 'react', postsCount: 47 },
  ];

  return (
    <aside className="space-y-4">
      {/* Database Integration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Database Engine
            </h3>
          </div>
          <span
            className={`flex items-center gap-1 text-[11px] font-semibold ${
              dbConnected ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {dbConnected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Atlas
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Local Demo
              </>
            )}
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          {dbConnected
            ? 'Connected to your live MongoDB Atlas cluster via Mongoose.'
            : 'Running in Local Store mode with full schema logic & bcrypt hashing.'}
        </p>
        <button
          type="button"
          onClick={onOpenDatabaseGuide}
          className="mt-3 w-full py-1.5 px-3 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
        >
          <span>Atlas Connection Guide</span>
        </button>
      </div>

      {/* Who to Follow */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Who to Follow
          </h3>
        </div>

        {discoverUsers.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">No recommendations available</p>
        ) : (
          <div className="space-y-3">
            {discoverUsers.map((u) => {
              const uId = u._id || u.id;
              const isFollowing = followingMap[uId];
              const isLoading = loadingMap[uId];

              return (
                <div key={uId} className="flex items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={() => onOpenProfile(u.username)}
                    className="flex items-center gap-2.5 text-left flex-1 min-w-0 group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                      <img
                        src={
                          u.avatar ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                        }
                        alt={u.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">@{u.username}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleFollowToggle(uId, u.username)}
                    disabled={isLoading}
                    className={`py-1 px-2.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
                      isFollowing
                        ? 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>Following</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Trending Topics */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Trending Topics
          </h3>
        </div>

        <div className="space-y-2">
          {trendingTopics.map(({ tag, postsCount }) => {
            const isSelected = activeTag === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onSelectTag && onSelectTag(isSelected ? '' : tag)}
                className={`w-full text-left p-2 rounded-xl transition-colors flex items-center justify-between text-xs ${
                  isSelected
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <div className="font-semibold text-slate-900">#{tag}</div>
                  <div className="text-[10px] text-slate-400">{postsCount} posts</div>
                </div>
                {isSelected && (
                  <span className="text-[10px] text-indigo-600 font-medium bg-white px-2 py-0.5 rounded-md shadow-2xs">
                    Active Filter
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};
