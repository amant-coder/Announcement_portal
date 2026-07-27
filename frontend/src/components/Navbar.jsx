import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { Bell, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export const Navbar = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isHome = location.pathname === '/';
  const isAdmin = location.pathname === '/admin';

  return (
    <header className="bg-college-navy dark:bg-slate-900 text-white shadow-md sticky top-0 z-40 border-b border-college-navyLight dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & College Title */}
          <Link to="/" className="flex items-center shrink-0">
            <img
              src="/logo.png"
              alt="Ghanshyamdas Saraf College Logo"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain bg-white rounded-lg px-2 shadow-sm"
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              to="/"
              className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-1.5 ${isHome
                  ? 'bg-white/10 text-college-gold border border-college-gold/30 shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
                }`}
            >
              <Bell className="w-4 h-4 text-college-gold" />
              <span className="hidden md:inline">Announcements</span>
            </Link>

            {/* Dark / Light Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-slate-800 dark:hover:bg-slate-700 text-college-gold dark:text-amber-300 transition-all duration-300 transform active:scale-95 border border-white/10 dark:border-slate-700 shadow-sm flex items-center justify-center group"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 transition-transform group-hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 transition-transform group-hover:-rotate-12" />
              )}
            </button>

            {isSignedIn && (
              <div className="flex items-center space-x-2 sm:space-x-3 pl-1 sm:pl-2 border-l border-slate-700">
                <Link
                  to="/admin"
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-1.5 ${isAdmin
                      ? 'bg-college-gold text-college-navy shadow-md font-bold'
                      : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden lg:inline">HOD Dashboard</span>
                </Link>

                <div className="flex items-center justify-center p-1 bg-white/10 rounded-full border border-slate-700">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
