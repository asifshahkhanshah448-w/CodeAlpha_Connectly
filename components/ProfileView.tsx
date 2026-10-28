'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './Toast';
import api from '@/client/src/api/apiClient';
import { PostCard, PostType } from './PostCard';
import { EditProfileModal } from './EditProfileModal';
import {
  Calendar,
  MapPin,
  Globe,
  ArrowLeft,
  Edit3,
  UserPlus,
  UserCheck,
  Loader2,
  FileText,
} from 'lucide-react';

interface ProfileViewProps {
  username: string;
  onBack: () => void;
  onOpenProfile?: (username: string) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ username, onBack, onOpenProfile }) => {
  const { user: currentUser, openAuthModal } = useAuth();
  const { success, error } = useToast();

  const [profileData, setProfileData] = useState<any>(null);
  const [posts, setPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      const res = await api.getProfile(username);
      if (res.success) {
        setProfileData(res.user);
        setPosts(res.posts || []);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error loading profile';
      error(msg);
    }
  }, [username, error]);

  useEffect(() => {
    let isMounted = true;
    api
      .getProfile(username)
      .then((res) => {
        if (isMounted && res.success) {
          setProfileData(res.user);
          setPosts(res.posts || []);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Error loading profile';
          error(msg);
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [username, error]);

  const handleFollowToggle = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (isFollowLoading || !profileData) return;
    setIsFollowLoading(true);

    const isFollowingNow = profileData.isFollowing;
    const targetId = profileData.id || profileData._id;

    try {
      const res = isFollowingNow
        ? await api.unfollowUser(targetId)
        : await api.followUser(targetId);

      if (res.success) {
        setProfileData((prev: any) => ({
          ...prev,
          isFollowing: res.isFollowing,
          followersCount: res.targetFollowersCount,
        }));
        success(res.isFollowing ? `Now following @${username}!` : `Unfollowed @${username}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update follow status';
      error(msg);
    } finally {
      setIsFollowLoading(false);
    }
  };

  const isSelf =
    currentUser &&
    profileData &&
    (currentUser._id === profileData._id ||
      currentUser.id === profileData.id ||
      currentUser.username === profileData.username);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
        <p className="text-xs text-slate-500">Loading user profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-slate-800">User not found</p>
        <p className="text-xs text-slate-500">
          We couldn&apos;t find an account for @{username}. It may have been deleted.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 py-1.5 px-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* Cover / Header Banner */}
        <div className="h-36 sm:h-44 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 relative">
          <button
            onClick={onBack}
            className="absolute top-4 left-4 p-2 bg-black/30 hover:bg-black/50 text-white rounded-full transition-colors flex items-center gap-1 text-xs backdrop-blur-xs"
            aria-label="Back to feed"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        {/* User Info Section */}
        <div className="px-5 sm:px-6 pb-6 pt-0 relative">
          {/* Avatar and Action CTA */}
          <div className="flex items-end justify-between -mt-14 mb-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white overflow-hidden bg-slate-100 shadow-md">
              <img
                src={
                  profileData.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${profileData.username}`
                }
                alt={profileData.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              {isSelf ? (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="py-2 px-4 border border-slate-300 hover:border-slate-400 bg-white text-slate-800 text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFollowToggle}
                  disabled={isFollowLoading}
                  className={`py-2 px-5 text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 ${
                    profileData.isFollowing
                      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/10'
                  }`}
                >
                  {isFollowLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : profileData.isFollowing ? (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Name & Username */}
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">{profileData.name}</h1>
            <p className="text-xs text-slate-500 font-medium">@{profileData.username}</p>
          </div>

          {/* Bio */}
          {profileData.bio && (
            <p className="mt-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {profileData.bio}
            </p>
          )}

          {/* Metadata details */}
          <div className="mt-3.5 flex items-center gap-4 flex-wrap text-xs text-slate-500">
            {profileData.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {profileData.location}
              </span>
            )}
            {profileData.website && (
              <a
                href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-600 hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                {profileData.website.replace(/^https?:\/\//, '')}
              </a>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Joined {formatDate(profileData.createdAt)}
            </span>
          </div>

          {/* Dynamic Database Statistics */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6">
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                {profileData.postsCount || posts.length}
              </span>
              <span className="text-xs text-slate-500">Posts</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                {profileData.followersCount || 0}
              </span>
              <span className="text-xs text-slate-500">Followers</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-slate-900">
                {profileData.followingCount || 0}
              </span>
              <span className="text-xs text-slate-500">Following</span>
            </div>
          </div>
        </div>
      </div>

      {/* User's Posts Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Posts by {profileData.name}</span>
          </h2>
          <span className="text-xs text-slate-400">{posts.length} published</span>
        </div>

        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center text-slate-400">
            <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-xs font-medium">@{profileData.username} hasn&apos;t shared any posts yet.</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard
              key={post._id || post.id}
              post={{
                ...post,
                author: profileData,
              }}
              onPostDeleted={(deletedId) =>
                setPosts((prev) => prev.filter((p) => p._id !== deletedId && p.id !== deletedId))
              }
              onOpenProfile={onOpenProfile}
            />
          ))
        )}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onProfileUpdated={fetchProfile}
        />
      )}
    </div>
  );
};
