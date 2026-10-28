'use client';

import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import {
  Layers,
  Search,
  Home,
  Compass,
  User,
  PenSquare,
  Database,
  LogIn,
  X,
} from 'lucide-react';

interface NavbarProps {
  currentTab: 'home' | 'discover' | 'profile';
  onSelectTab: (tab: 'home' | 'discover' | 'profile') => void;
  onOpenProfile: (username: string) => void;
  onOpenDatabaseGuide: () => void;
  onSearch: (query: string) => void;
  onFocusComposer?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
  onOpenDatabaseGuide,
  onSearch,
  onFocusComposer,
}) => {
  const { user, openAuthModal } = useAuth();
  const [searchInput, setSearchInput] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Mobile brand logo */}
          <div
            className="flex items-center gap-2 cursor-pointer md:hidden"
            onClick={() => onSelectTab('home')}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Layers className="w-4 h-4" />
            </div>
            <span className="font-bold text-base text-slate-900 tracking-tight">Connectly</span>
          </div>

          {/* Search bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex-1 max-w-md mx-auto md:mx-0"
          >
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search users or tags..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-slate-100/80 border border-transparent rounded-full focus:outline-none focus:bg-white focus:border-indigo-500/30 focus:ring-2 focus:ring-indigo-500/10 transition-all text-slate-800"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  onSearch('');
                }}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenDatabaseGuide}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/60 border border-slate-200 transition-colors"
              title="MongoDB Atlas status"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span>MongoDB</span>
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => onOpenProfile(user.username)}
                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200/80 hover:ring-2 hover:ring-indigo-500/20 transition-all"
              >
                <img
                  src={
                    user.avatar ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                  }
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Screens < 768px) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around">
        <button
          type="button"
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-0.5 p-1 text-xs font-medium ${
            currentTab === 'home' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('discover')}
          className={`flex flex-col items-center gap-0.5 p-1 text-xs font-medium ${
            currentTab === 'discover' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Explore</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!user) {
              openAuthModal('login');
            } else if (onFocusComposer) {
              onFocusComposer();
            }
          }}
          className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 -mt-4 active:scale-95 transition-transform"
          aria-label="New post"
        >
          <PenSquare className="w-5 h-5" />
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
          className={`flex flex-col items-center gap-0.5 p-1 text-xs font-medium ${
            currentTab === 'profile' ? 'text-indigo-600 font-bold' : 'text-slate-500'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profile</span>
        </button>
      </nav>
    </>
  );
};
