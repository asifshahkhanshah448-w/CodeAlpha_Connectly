'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import { ToastProvider, useToast } from '@/components/Toast';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';
import { RightPanel } from '@/components/RightPanel';
import { PostComposer } from '@/components/PostComposer';
import { PostCard, PostType } from '@/components/PostCard';
import { ProfileView } from '@/components/ProfileView';
import { AuthModal } from '@/components/AuthModal';
import { DatabaseStatusModal } from '@/components/DatabaseStatusModal';
import api from '@/client/src/api/apiClient';
import {
  Sparkles,
  Users,
  Compass,
  Loader2,
  X,
  RefreshCw,
  Search,
  UserPlus,
  UserCheck,
} from 'lucide-react';

function ConnectlyApp() {
  const { user, openAuthModal } = useAuth();
  const { error } = useToast();

  const [currentTab, setCurrentTab] = useState<'home' | 'discover' | 'profile'>('home');
  const [feedTab, setFeedTab] = useState<'all' | 'following'>('all');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [activeProfileUsername, setActiveProfileUsername] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Feed posts state
  const [posts, setPosts] = useState<PostType[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Discover tab state
  const [discoverList, setDiscoverList] = useState<any[]>([]);
  const [isDiscoverLoading, setIsDiscoverLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Database Guide Modal
  const [isDbGuideOpen, setIsDbGuideOpen] = useState(false);

  const composerRef = useRef<HTMLDivElement>(null);

  // Fetch feed posts
  const refreshFeed = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const res = await api.getFeed({
        page: 1,
        limit: 8,
        tab: feedTab,
        tag: activeTag || undefined,
      });

      if (res.success) {
        setPosts(res.posts);
        setPage(res.pagination.page);
        setHasMore(res.pagination.hasMore);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load posts';
      error(msg);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [feedTab, activeTag, error]);

  const loadMorePosts = async () => {
    setIsLoadingMore(true);
    try {
      const res = await api.getFeed({
        page: page + 1,
        limit: 8,
        tab: feedTab,
        tag: activeTag || undefined,
      });

      if (res.success) {
        setPosts((prev) => [...prev, ...res.posts]);
        setPage(res.pagination.page);
        setHasMore(res.pagination.hasMore);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load more posts';
      error(msg);
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    api
      .getFeed({
        page: 1,
        limit: 8,
        tab: feedTab,
        tag: activeTag || undefined,
      })
      .then((res) => {
        if (isMounted && res.success) {
          setPosts(res.posts);
          setPage(res.pagination.page);
          setHasMore(res.pagination.hasMore);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load posts';
          error(msg);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingPosts(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [feedTab, activeTag, error]);

  // Handle Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.searchUsers(searchQuery);
        if (res.success) {
          setSearchResults(res.users);
        }
      } catch {
        // Quiet search fail
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load Discover list
  const refreshDiscover = useCallback(async () => {
    setIsDiscoverLoading(true);
    try {
      const res = await api.discoverUsers();
      if (res.success) {
        setDiscoverList(res.users);
      }
    } catch {
      // Quiet fail
    } finally {
      setIsDiscoverLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentTab === 'discover') {
      let isMounted = true;
      api
        .discoverUsers()
        .then((res) => {
          if (isMounted && res.success) {
            setDiscoverList(res.users);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsDiscoverLoading(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [currentTab]);

  // Handle Follow in Discover tab
  const handleFollowFromDiscover = async (targetId: string) => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    const isCurrentlyFollowing = Boolean(followingMap[targetId]);
    try {
      const res = isCurrentlyFollowing
        ? await api.unfollowUser(targetId)
        : await api.followUser(targetId);

      if (res.success) {
        setFollowingMap((prev) => ({ ...prev, [targetId]: res.isFollowing }));
      }
    } catch {
      // Handled in api client
    }
  };

  const handlePostCreated = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (deletedId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId && p.id !== deletedId));
  };

  const handleOpenProfile = (username: string) => {
    setActiveProfileUsername(username);
    setCurrentTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFocusComposer = () => {
    setCurrentTab('home');
    setActiveProfileUsername(null);
    composerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased pb-16 md:pb-6">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'home') setActiveProfileUsername(null);
        }}
        onOpenProfile={handleOpenProfile}
        onOpenDatabaseGuide={() => setIsDbGuideOpen(true)}
        onSearch={(query) => setSearchQuery(query)}
        onFocusComposer={handleFocusComposer}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="flex gap-6 items-start">
          {/* Left Sidebar (Desktop) */}
          <div className="hidden md:block w-56 lg:w-64 shrink-0">
            <Sidebar
              currentTab={currentTab}
              onSelectTab={(tab) => {
                setCurrentTab(tab);
                if (tab === 'home') setActiveProfileUsername(null);
              }}
              onOpenProfile={handleOpenProfile}
              onOpenDatabaseGuide={() => setIsDbGuideOpen(true)}
              onFocusComposer={handleFocusComposer}
            />
          </div>

          {/* Central Main Content */}
          <main className="flex-1 min-w-0 max-w-2xl mx-auto space-y-4">
            {/* Search Overlay dropdown */}
            {searchQuery.trim() && (
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs font-semibold text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5" /> Search results for &ldquo;{searchQuery}&rdquo;
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isSearching ? (
                  <div className="py-4 text-center text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1" />
                    Searching users...
                  </div>
                ) : searchResults.length === 0 ? (
                  <p className="py-3 text-center text-xs text-slate-400">
                    No users found matching &ldquo;{searchQuery}&rdquo;.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((u) => (
                      <div
                        key={u._id || u.id}
                        onClick={() => {
                          handleOpenProfile(u.username);
                          setSearchQuery('');
                        }}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                            <img
                              src={
                                u.avatar ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                              }
                              alt={u.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900">{u.name}</div>
                            <div className="text-[11px] text-slate-400">@{u.username}</div>
                          </div>
                        </div>
                        <span className="text-[11px] text-indigo-600 font-semibold">View</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Profile View Tab */}
            {currentTab === 'profile' && (
              <ProfileView
                username={activeProfileUsername || user?.username || 'sarah_chen'}
                onBack={() => {
                  setCurrentTab('home');
                  setActiveProfileUsername(null);
                }}
                onOpenProfile={handleOpenProfile}
              />
            )}

            {/* Explore / Discover Tab */}
            {currentTab === 'discover' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Compass className="w-5 h-5 text-indigo-600" />
                      <h2 className="text-base font-bold text-slate-900">Explore Connectly Creators</h2>
                    </div>
                    <button
                      onClick={refreshDiscover}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Refresh creators"
                    >
                      <RefreshCw className={`w-4 h-4 ${isDiscoverLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Discover engineers, designers, and innovators building on Connectly.
                  </p>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {discoverList.map((creator) => {
                      const cId = creator._id || creator.id;
                      const isFollowing = followingMap[cId];

                      return (
                        <div
                          key={cId}
                          className="p-3.5 bg-slate-50/70 border border-slate-200/60 rounded-xl flex flex-col justify-between hover:bg-slate-50 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 mb-2">
                              <div
                                onClick={() => handleOpenProfile(creator.username)}
                                className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0 cursor-pointer"
                              >
                                <img
                                  src={
                                    creator.avatar ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`
                                  }
                                  alt={creator.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div
                                onClick={() => handleOpenProfile(creator.username)}
                                className="cursor-pointer min-w-0"
                              >
                                <h4 className="text-xs font-bold text-slate-900 hover:text-indigo-600 truncate">
                                  {creator.name}
                                </h4>
                                <p className="text-[11px] text-slate-400 truncate">
                                  @{creator.username}
                                </p>
                              </div>
                            </div>
                            {creator.bio && (
                              <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                                {creator.bio}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                            <span className="text-[11px] text-slate-400">
                              {creator.followersCount || 0} followers
                            </span>
                            <button
                              type="button"
                              onClick={() => handleFollowFromDiscover(cId)}
                              className={`py-1 px-3 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                                isFollowing
                                  ? 'bg-white border border-slate-200 text-slate-700'
                                  : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs'
                              }`}
                            >
                              {isFollowing ? (
                                <>
                                  <UserCheck className="w-3 h-3" /> Following
                                </>
                              ) : (
                                <>
                                  <UserPlus className="w-3 h-3" /> Follow
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Home Feed Tab */}
            {currentTab === 'home' && (
              <>
                {/* Post Composer Card */}
                <div ref={composerRef}>
                  <PostComposer onPostCreated={handlePostCreated} />
                </div>

                {/* Feed Controls: Segmented Tabs + Tag Filter */}
                <div className="flex items-center justify-between gap-3 pt-1">
                  {/* Segmented feed tabs */}
                  <div className="flex p-1 bg-slate-200/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setFeedTab('all')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        feedTab === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>For You</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          openAuthModal('login');
                        } else {
                          setFeedTab('following');
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        feedTab === 'following'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Following</span>
                    </button>
                  </div>

                  {/* Active Tag indicator */}
                  {activeTag && (
                    <div className="flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg">
                      <span>Tag: #{activeTag}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTag(null)}
                        className="p-0.5 hover:text-indigo-900"
                        title="Clear tag filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={refreshFeed}
                    className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                    title="Refresh feed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPosts ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {/* Posts Feed Stream */}
                {isLoadingPosts ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3 animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200" />
                          <div className="space-y-1.5">
                            <div className="w-28 h-3.5 bg-slate-200 rounded" />
                            <div className="w-20 h-2.5 bg-slate-100 rounded" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="w-full h-3 bg-slate-100 rounded" />
                          <div className="w-5/6 h-3 bg-slate-100 rounded" />
                          <div className="w-3/4 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
                    <Sparkles className="w-8 h-8 mx-auto text-slate-300" />
                    <h3 className="text-sm font-bold text-slate-700">No posts in this feed yet</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {feedTab === 'following'
                        ? 'You are not following anyone yet or followed creators have not posted. Discover and follow people from the right panel!'
                        : 'Be the first to share an update with the Connectly community!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <PostCard
                        key={post._id || post.id}
                        post={post}
                        onPostDeleted={handlePostDeleted}
                        onOpenProfile={handleOpenProfile}
                      />
                    ))}

                    {/* Load More Button */}
                    {hasMore && (
                      <div className="pt-2 text-center">
                        <button
                          type="button"
                          onClick={loadMorePosts}
                          disabled={isLoadingMore}
                          className="py-2 px-5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-semibold rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5"
                        >
                          {isLoadingMore ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Loading posts...</span>
                            </>
                          ) : (
                            <span>Load More Posts</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>

          {/* Right Panel (Desktop) */}
          <div className="hidden xl:block w-72 shrink-0">
            <RightPanel
              onOpenProfile={handleOpenProfile}
              onSelectTag={(tag) => {
                setActiveTag(tag || null);
                setCurrentTab('home');
              }}
              activeTag={activeTag}
              onOpenDatabaseGuide={() => setIsDbGuideOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <AuthModal />
      <DatabaseStatusModal
        isOpen={isDbGuideOpen}
        onClose={() => setIsDbGuideOpen(false)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ConnectlyApp />
      </AuthProvider>
    </ToastProvider>
  );
}
