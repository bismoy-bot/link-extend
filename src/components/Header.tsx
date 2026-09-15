import React from 'react';
import {
  Maximize2,
  ShieldCheck,
  Link2,
  BarChart3,
  History,
  User as UserIcon,
  LogOut,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type MainNavTab = 'enlarge' | 'shorten' | 'dashboard';

interface HeaderProps {
  currentNav: MainNavTab;
  setCurrentNav: (nav: MainNavTab) => void;
  unshortenSubTab: 'single' | 'batch';
  setUnshortenSubTab: (tab: 'single' | 'batch') => void;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenAuthModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentNav,
  setCurrentNav,
  unshortenSubTab,
  setUnshortenSubTab,
  historyCount,
  onOpenHistory,
  onOpenAuthModal,
}) => {
  const { user, logout, loginAsDemo } = useAuth();

  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => setCurrentNav('enlarge')}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-xs cursor-pointer"
          >
            <Maximize2 className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => setCurrentNav('enlarge')}
                className="font-extrabold text-stone-900 tracking-tight text-base sm:text-lg leading-tight cursor-pointer"
              >
                Link Expander
              </h1>
              <span className="hidden lg:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" /> Shorten & Enlarge
              </span>
            </div>
            <p className="text-[11px] text-stone-600 hidden md:block">
              Enlarge shortened links & create custom alias URLs with analytics
            </p>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200">
          <button
            type="button"
            onClick={() => setCurrentNav('enlarge')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentNav === 'enlarge'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Enlarge Link</span>
            <span className="sm:hidden">Enlarge</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentNav('shorten')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentNav === 'shorten'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Shorten & Alias</span>
            <span className="sm:hidden">Shorten</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentNav('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentNav === 'dashboard'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">My Dashboard</span>
            <span className="sm:hidden">Dashboard</span>
          </button>
        </nav>

        {/* User Auth & Actions */}
        <div className="flex items-center gap-2">
          {currentNav === 'enlarge' && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 rounded-xl transition-colors cursor-pointer"
              title="Recent unshortened link history"
            >
              <History className="w-3.5 h-3.5 text-stone-500" />
              <span>History</span>
              {historyCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 bg-stone-900 text-white rounded-full text-[10px] font-bold">
                  {historyCount}
                </span>
              )}
            </button>
          )}

          {user ? (
            <div className="flex items-center gap-1.5 bg-stone-50 border border-stone-200 rounded-xl pl-2.5 pr-1 py-1">
              <div className="flex items-center gap-1.5 text-xs font-medium text-stone-800">
                <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-800 flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={loginAsDemo}
                className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl transition-colors cursor-pointer"
                title="Sign in instantly with demo account"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Demo</span>
              </button>
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
