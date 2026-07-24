import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { Plus, Bell, RefreshCw, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getMyAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement, getCourses } from '../services/api';
import AnnouncementCard from '../components/AnnouncementCard';
import AnnouncementModal from '../components/AnnouncementModal';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

export const AdminDashboard = () => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [announcements, setAnnouncements] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch HOD's own announcements & courses list
  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [annRes, courseRes] = await Promise.all([
        getMyAnnouncements(getToken),
        getCourses(),
      ]);

      if (annRes.success) {
        setAnnouncements(annRes.data);
      }
      if (courseRes.success) {
        setCourses(courseRes.data);
      }
    } catch (err) {
      console.error('[Dashboard Fetch Error]:', err);
      const msg = err.response?.data?.error || err.message;
      setError(typeof msg === 'string' ? msg : 'Failed to load your announcements.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  // Create or Update Handler
  const handleSaveAnnouncement = async (payload) => {
    if (editingItem) {
      const res = await updateAnnouncement(editingItem._id, payload, getToken);
      if (!res.success) {
        throw new Error(String(res.error || 'Failed to update announcement.'));
      }
      showToast('Announcement updated successfully!');
      fetchDashboardData();
    } else {
      const res = await createAnnouncement(payload, getToken);
      if (!res.success) {
        throw new Error(String(res.error || 'Failed to create announcement.'));
      }
      showToast('Announcement published successfully!');
      fetchDashboardData();
    }
  };

  // Delete Handler
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    try {
      setIsDeleting(true);
      const res = await deleteAnnouncement(deletingItem._id, getToken);
      if (res.success) {
        showToast('Announcement deleted successfully.');
        setIsDeleteModalOpen(false);
        setDeletingItem(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('[Delete Error]:', err);
      const msg = err.response?.data?.error || err.message;
      setError(typeof msg === 'string' ? msg : 'Failed to delete announcement.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-xl shadow-lg border border-emerald-500 text-xs font-bold flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Dashboard Top Header */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-college-navy mb-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Authenticated HOD Workspace</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-college-navy">
            Department Notice Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as: <strong className="text-slate-800">{user?.fullName || user?.emailAddresses[0]?.emailAddress}</strong> (Clerk ID: <code className="font-mono text-slate-700">{user?.id}</code>)
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1.5"
            title="Refresh list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 bg-college-navy hover:bg-college-navyLight text-college-gold font-bold rounded-xl text-xs transition-all shadow-md flex items-center space-x-2 border border-college-gold/30 scale-100 hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Announcement</span>
          </button>
        </div>
      </div>

      {/* My Announcements Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-heading font-bold text-college-textDark flex items-center gap-2">
            <span>My Posted Announcements</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-sans font-semibold">
              {announcements.length}
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            Ownership server-validated on every action
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold mb-6 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 text-center">
            <div className="w-10 h-10 border-4 border-college-navy border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs font-semibold text-slate-500">Fetching your department notices...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && announcements.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto my-8">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No Announcements Posted Yet</h3>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
              You haven't posted any notices for your department yet. Click below to create your first announcement.
            </p>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-college-navy text-college-gold font-bold text-xs rounded-lg shadow-sm"
            >
              Post First Announcement
            </button>
          </div>
        )}

        {/* Grid of HOD Announcements */}
        {!isLoading && announcements.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {announcements.map((item) => (
              <AnnouncementCard
                key={item._id}
                announcement={item}
                isAdminView={true}
                onEdit={(ann) => {
                  setEditingItem(ann);
                  setIsModalOpen(true);
                }}
                onDelete={(ann) => {
                  setDeletingItem(ann);
                  setIsDeleteModalOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal for Create / Edit */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveAnnouncement}
        initialData={editingItem}
        courses={courses}
      />

      {/* Modal for Delete Confirmation */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        title={deletingItem?.title || ''}
      />
    </div>
  );
};

export default AdminDashboard;
