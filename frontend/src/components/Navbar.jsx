import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth, UserButton } from '@clerk/clerk-react';
import { GraduationCap, ShieldAlert, LayoutDashboard, LogIn, Bell } from 'lucide-react';

export const Navbar = () => {
  const { isSignedIn } = useAuth();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <header className="bg-college-navy text-white shadow-md sticky top-0 z-40 border-b border-college-navyLight">
      {/* Top Banner */}
      <div className="bg-college-gold text-college-navy font-semibold text-xs py-1 px-4 text-center tracking-wide flex items-center justify-center gap-2">
        <span>Ghanshyamdas Saraf College of Arts & Commerce</span>
        <span className="hidden md:inline">•</span>
        <span className="hidden md:inline">Affiliated to University of Mumbai | Re-accredited 'A' Grade by NAAC</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & College Title */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform border border-college-gold">
              <GraduationCap className="w-8 h-8 text-college-navy" />
            </div>
            <div>
              <div className="font-heading font-bold text-lg md:text-xl tracking-tight text-white group-hover:text-college-gold transition-colors">
                GHANSHYAMDAS SARAF COLLEGE
              </div>
              <div className="text-xs text-slate-300 font-medium">
                Official Student Announcement Portal • Malad (W), Mumbai
              </div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-3">
            <Link
              to="/"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                isHome
                  ? 'bg-white/10 text-college-gold border border-college-gold/30'
                  : 'text-slate-200 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements</span>
            </Link>

            {isSignedIn ? (
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-700">
                <Link
                  to="/admin"
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center space-x-1.5 ${
                    isAdmin
                      ? 'bg-college-gold text-college-navy shadow-sm'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>HOD Dashboard</span>
                </Link>

                <div className="flex items-center justify-center p-1 bg-white/10 rounded-full border border-slate-700">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </div>
            ) : (
              <Link
                to="/admin/login"
                className="px-4 py-2 bg-college-gold hover:bg-college-goldHover text-college-navy font-semibold rounded-lg text-sm transition-all shadow-sm flex items-center space-x-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>HOD Portal</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
