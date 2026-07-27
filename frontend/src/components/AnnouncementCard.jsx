import React, { useState, useEffect } from 'react';
import { Pin, Calendar, FileText, Download, Edit3, Trash2, Tag, AlertCircle, Bookmark, ExternalLink } from 'lucide-react';
import { isBookmarked as checkIsBookmarked, toggleBookmark } from '../utils/bookmarks';

export const AnnouncementCard = ({ announcement, isAdminView = false, onEdit, onDelete, onBookmarkToggle }) => {
  const {
    _id,
    title,
    content,
    courseCodes = [],
    isPinned,
    attachmentUrl,
    expiresAt,
    createdAt,
  } = announcement;

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(checkIsBookmarked(_id));
  }, [_id]);

  const handleBookmarkClick = (e) => {
    e.stopPropagation();
    const newState = toggleBookmark(_id);
    setSaved(newState);
    if (onBookmarkToggle) {
      onBookmarkToggle(_id, newState);
    }
  };

  // Format date strings
  const formattedCreated = new Date(createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const isExpired = expiresAt && new Date(expiresAt) < new Date();
  const formattedExpires = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    : null;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-card-hover dark:hover:shadow-slate-900/40 transition-all duration-300 border p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between group ${
        isPinned
          ? 'border-amber-400 dark:border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/20'
          : 'border-slate-200 dark:border-slate-700'
      } ${announcement.status === 'DRAFT' ? 'opacity-80 border-dashed' : ''}`}
    >
      {/* Draft Accent Ribbon */}
      {isAdminView && announcement.status === 'DRAFT' && (
        <div className="absolute top-0 right-0 bg-slate-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
          <span>Draft</span>
        </div>
      )}
      {/* Pinned Accent Ribbon */}
      {isPinned && (!isAdminView || announcement.status !== 'DRAFT') && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
          <Pin className="w-3 h-3 fill-current" />
          <span>Pinned Announcement</span>
        </div>
      )}

      <div>
        {/* Course Code Badges, Bookmark & Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pr-24">
          <div className="flex flex-wrap gap-1.5 items-center">
            {courseCodes.map((code) => (
              <span
                key={code}
                className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-college-navy/10 dark:bg-slate-700 text-college-navy dark:text-college-gold border border-college-navy/20 dark:border-slate-600 flex items-center gap-1"
              >
                <Tag className="w-3 h-3" />
                {code}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handleBookmarkClick}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
                saved
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800'
                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title={saved ? 'Remove from Saved' : 'Bookmark Announcement'}
            >
              <Bookmark className={`w-4 h-4 ${saved ? 'fill-current text-amber-500' : ''}`} />
              <span className="hidden sm:inline">{saved ? 'Saved' : 'Save'}</span>
            </button>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{formattedCreated}</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-heading font-bold text-college-textDark dark:text-white mb-2 leading-snug group-hover:text-college-navyLight dark:group-hover:text-amber-300 transition-colors">
          {title}
        </h3>

        {/* Sanitized HTML Content */}
        <div
          className="prose prose-sm text-slate-600 dark:text-slate-300 max-w-none mb-4 leading-relaxed line-clamp-6 dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Footer Area: Attachment, Expiry & Admin Actions */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Attachment Actions */}
          {attachmentUrl && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-bold bg-college-navy dark:bg-college-gold hover:bg-college-navyLight dark:hover:bg-college-goldHover text-college-gold dark:text-college-navy px-3.5 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
              title="Open document directly in new tab"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>View Attached Document</span>
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
          )}

          {/* Expiration Notice */}
          {formattedExpires && (
            <div
              className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1 font-medium ${
                isExpired
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{isExpired ? `Expired on ${formattedExpires}` : `Expires: ${formattedExpires}`}</span>
            </div>
          )}
        </div>

        {/* HOD Action Buttons */}
        {isAdminView && (
          <div className="flex items-center space-x-2 self-end sm:self-auto">
            <button
              onClick={() => onEdit(announcement)}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
              title="Edit Announcement"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete(announcement)}
              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
              title="Delete Announcement"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
