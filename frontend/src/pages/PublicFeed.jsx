import React, { useState, useEffect } from 'react';
import { Search, Bell, Layers, RefreshCw, AlertCircle } from 'lucide-react';
import { getCourses, getAnnouncements } from '../services/api';
import CourseFilterChips from '../components/CourseFilterChips';
import AnnouncementCard from '../components/AnnouncementCard';

export const PublicFeed = () => {
  const [courses, setCourses] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch initial course options
  useEffect(() => {
    const fetchCourseList = async () => {
      try {
        const res = await getCourses();
        if (res.success) {
          setCourses(res.data);
        }
      } catch (err) {
        console.error('[Fetch Courses Error]:', err);
      }
    };
    fetchCourseList();
  }, []);

  // Fetch announcements whenever selectedCourse or searchQuery changes
  const fetchAnnouncementsList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAnnouncements(selectedCourse, searchQuery);
      if (res.success) {
        setAnnouncements(res.data);
      }
    } catch (err) {
      console.error('[Fetch Announcements Error]:', err);
      setError('Unable to load announcements. Please check server connection.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAnnouncementsList();
    }, 300); // 300ms debounce for search input

    return () => clearTimeout(timer);
  }, [selectedCourse, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      {/* College Hero Section */}
      <div className="bg-gradient-to-r from-college-navy via-college-navyLight to-slate-900 rounded-2xl p-6 sm:p-10 text-white shadow-lg mb-8 relative overflow-hidden border border-college-gold/20">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 bg-college-gold/20 text-college-gold px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 border border-college-gold/30">
            <Bell className="w-3.5 h-3.5" />
            <span>Student Notice Board</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-heading font-extrabold tracking-tight mb-3 text-white leading-tight">
            Academic Announcements & Notices
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Real-time verified updates from Head of Departments for BMS, BCom, BAF, BBI, BFM, BSc IT, BMM, BA, and BSc students. Zero login required.
          </p>
        </div>

        {/* Decorative background accent */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
          <Layers className="w-96 h-96 text-white" />
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notices by title, exam, timetable, assignment..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-college-navy/30 focus:border-college-navy text-sm placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchAnnouncementsList}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 shrink-0"
            title="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Course Filter Chips */}
        <CourseFilterChips
          courses={courses}
          activeCourse={selectedCourse}
          onSelectCourse={(code) => setSelectedCourse(code)}
        />
      </div>

      {/* Announcements Feed Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold text-college-textDark flex items-center gap-2">
            <span>Latest Notices</span>
            {selectedCourse !== 'ALL' && (
              <span className="text-xs bg-college-navy text-college-gold px-2.5 py-0.5 rounded-full font-sans">
                {selectedCourse}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Showing {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
          </span>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-college-navy border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-500">Loading student announcements...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center text-rose-700 max-w-md mx-auto my-8">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchAnnouncementsList}
              className="mt-3 px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold shadow-sm"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && announcements.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Announcements Found</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              There are currently no active announcements matching your selected course filter or search query.
            </p>
          </div>
        )}

        {/* Announcement Grid */}
        {!isLoading && !error && announcements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((item) => (
              <AnnouncementCard key={item._id} announcement={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicFeed;
