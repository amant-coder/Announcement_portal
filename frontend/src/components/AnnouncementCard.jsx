import React from 'react';
import { Pin, Calendar, FileText, Download, Edit3, Trash2, Tag, AlertCircle } from 'lucide-react';
import { fixCloudinaryUrl } from '../services/cloudinary';

export const AnnouncementCard = ({ announcement, isAdminView = false, onEdit, onDelete }) => {
  const {
    _id,
    title,
    content,
    courseCodes = [],
    isPinned,
    attachmentUrl: rawAttachmentUrl,
    expiresAt,
    createdAt,
  } = announcement;

  // Derive filename from URL and fix delivery type (PDF needs /raw/upload/ not /image/upload/)
  const attachmentFilename = rawAttachmentUrl ? rawAttachmentUrl.split('/').pop() : null;
  const attachmentUrl = fixCloudinaryUrl(rawAttachmentUrl, attachmentFilename);

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
      className={`bg-white rounded-xl shadow-sm hover:shadow-card-hover transition-all duration-200 border p-5 sm:p-6 relative overflow-hidden flex flex-col justify-between ${
        isPinned ? 'border-amber-400 bg-amber-50/20' : 'border-slate-200'
      }`}
    >
      {/* Pinned Accent Ribbon */}
      {isPinned && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-sm flex items-center gap-1">
          <Pin className="w-3 h-3 fill-current" />
          <span>Pinned Announcement</span>
        </div>
      )}

      <div>
        {/* Course Code Badges & Date */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pr-24">
          <div className="flex flex-wrap gap-1.5">
            {courseCodes.map((code) => (
              <span
                key={code}
                className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-college-navy/10 text-college-navy border border-college-navy/20 flex items-center gap-1"
              >
                <Tag className="w-3 h-3 text-college-navy" />
                {code}
              </span>
            ))}
          </div>

          <div className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedCreated}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-heading font-bold text-college-textDark mb-2 leading-snug">
          {title}
        </h3>

        {/* Sanitized HTML Content */}
        <div
          className="prose prose-sm text-slate-600 max-w-none mb-4 leading-relaxed line-clamp-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>

      {/* Footer Area: Attachment, Expiry & Admin Actions */}
      <div className="pt-4 border-t border-slate-100 mt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Attachment Download Link */}
          {attachmentUrl && (
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-college-navy px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-college-navy" />
              <span>Attachment</span>
              <Download className="w-3 h-3 ml-0.5 text-slate-500" />
            </a>
          )}

          {/* Expiration Notice */}
          {formattedExpires && (
            <div
              className={`text-xs px-2.5 py-1 rounded-md flex items-center gap-1 font-medium ${
                isExpired
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-slate-100 text-slate-600'
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
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
              title="Edit Announcement"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              onClick={() => onDelete(announcement)}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
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
