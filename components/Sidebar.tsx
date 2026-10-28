'use client';

import React from 'react';
import { useAuth } from './AuthContext';
import {
  Home,
  Compass,
  Bell,
  User,
  Database,
  LogOut,
  PenSquare,
  LogIn,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  currentTab: 'home' | 'discover' | 'profile';
  onSelectTab: (tab: 'home' | 'discover' | 'profile') => void;
  onOpenProfile: (username: string) => void;
  onOpenDatabaseGuide: () => void;
  onFocusComposer?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
  onOpenDatabaseGuide,
  onFocusComposer,
}) => {
  const { user, logout, openAuthModal } = useAuth();

  return (
    <nav className="flex flex-col justify-between h-[calc(100vh-2rem)] sticky top-4 select-none">
      <div className="space-y-6">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" onClick={() => onSelectTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Connectly</span>
              <span className="text-[10px] uppercase font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                v1.0
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium">Social Platform</div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSelectTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'home'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Feed</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('discover')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'discover'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-5 h-5" />
            <span>Explore</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (user) {
                onOpenProfile(user.username);
              } else {
                openAuthModal('login');
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              currentTab === 'profile'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span>My Profile</span>
          </button>

          <button
            type="button"
            onClick={onOpenDatabaseGuide}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          >
            <Database className="w-5 h-5 text-indigo-600" />
            <span>MongoDB Atlas</span>
          </button>
        </div>

        {/* Create Post Button */}
        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthModal('login');
            } else if (onFocusComposer) {
              onFocusComposer();
            }
          }}
          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-indigo-600/15 flex items-center justify-center gap-2 transition-all hover:shadow-lg"
        >
          <PenSquare className="w-4 h-4" />
          <span>New Post</span>
        </button>
      </div>

      {/* User profile / login widget */}
      <div className="pt-4 border-t border-slate-200/80">
        {user ? (
          <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <button
              type="button"
              onClick={() => onOpenProfile(user.username)}
              className="flex items-center gap-2.5 text-left min-w-0 flex-1 group"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                  }
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="truncate">
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                  {user.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate">@{user.username}</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Log out"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
