import React, { useState } from 'react';
import { LeafIcon, CogIcon, SunIcon, MoonIcon, LogOutIcon, FilterXIcon } from './icons';
import { User } from '../types';

type Theme = 'light' | 'dark';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  showLostOnly: boolean;
  onToggleLostFilter: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout, theme, setTheme, showLostOnly, onToggleLostFilter }) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleLogoutClick = () => {
    onLogout();
    setIsSettingsOpen(false);
  }

  const handleFilterClick = () => {
    onToggleLostFilter();
    setIsSettingsOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-white/70 dark:bg-[#34495E]/70 backdrop-blur-lg shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center">
            <LeafIcon className="h-8 w-8 text-forest-green" />
            <h1 className="ml-3 text-2xl font-bold text-gray-800 dark:text-white tracking-wider">VrikshaTracker</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <span className="hidden sm:block text-gray-700 dark:text-gray-300">
                    Welcome, <span className="font-semibold">{user.name}</span>
                </span>
                <div className="relative">
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className="p-2 rounded-full text-gray-500 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#4A6572] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#34495E] focus:ring-forest-green"
                    >
                        <CogIcon className="w-6 h-6" />
                    </button>
                    {isSettingsOpen && (
                        <div 
                          className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#4A6572] rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-[#5E7A8A]"
                          onMouseLeave={() => setIsSettingsOpen(false)}
                        >
                            <button
                                onClick={toggleTheme}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#5E7A8A]"
                            >
                                {theme === 'light' ? <MoonIcon className="w-5 h-5 mr-3" /> : <SunIcon className="w-5 h-5 mr-3" />}
                                Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
                            </button>
                            <button
                                onClick={handleFilterClick}
                                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#5E7A8A]"
                            >
                                <FilterXIcon className="w-5 h-5 mr-3" />
                                {showLostOnly ? 'View All Saplings' : 'View Lost Saplings'}
                            </button>
                             <div className="my-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                             <button
                                onClick={handleLogoutClick}
                                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/40"
                            >
                                <LogOutIcon className="w-5 h-5 mr-3" />
                                Logout
                            </button>
                        </div>
                    )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};