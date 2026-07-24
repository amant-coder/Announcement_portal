import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { X, Upload, Pin, Calendar, AlertCircle, Loader2, FileCheck } from 'lucide-react';
import { uploadFileToCloudinary } from '../services/cloudinary';

export const AnnouncementModal = ({ isOpen, onClose, onSave, initialData = null, courses = [] }) => {
  const { getToken } = useAuth();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setSelectedCourses(initialData.courseCodes || []);
      setIsPinned(initialData.isPinned || false);
      setAttachmentUrl(initialData.attachmentUrl || '');
      setExpiresAt(initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : '');
    } else {
      setTitle('');
      setContent('');
      setSelectedCourses([]);
      setIsPinned(false);
      setAttachmentUrl('');
      setExpiresAt('');
    }
    setFileToUpload(null);
    setErrorMsg('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const availableCourseList = courses && courses.length > 0
    ? courses
    : [
        { code: 'BCOM' }, { code: 'BAF' }, { code: 'BBI' }, { code: 'BFM' },
        { code: 'BMS' }, { code: 'BSCIT' }, { code: 'BMM' }, { code: 'BA' }, { code: 'BSC' },
      ];

  const allCodesSelected =
    availableCourseList.length > 0 &&
    availableCourseList.every((c) => selectedCourses.includes(c.code));

  const toggleAllCourses = () => {
    if (allCodesSelected) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(availableCourseList.map((c) => c.code));
    }
  };

  const toggleCourseSelection = (code) => {
    if (selectedCourses.includes(code)) {
      setSelectedCourses(selectedCourses.filter((c) => c !== code));
    } else {
      setSelectedCourses([...selectedCourses, code]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFileToUpload(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Announcement title is required.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('Announcement content is required.');
      return;
    }
    if (selectedCourses.length === 0) {
      setErrorMsg('Please select at least one course tag.');
      return;
    }

    try {
      setIsSubmitting(true);

      let finalAttachmentUrl = attachmentUrl;

      // Handle signed file upload if a new file was selected
      if (fileToUpload) {
        setIsUploading(true);
        finalAttachmentUrl = await uploadFileToCloudinary(fileToUpload, getToken);
        setIsUploading(false);
      }

      const payload = {
        title: title.trim(),
        content: content.trim(),
        courseCodes: selectedCourses,
        isPinned,
        attachmentUrl: finalAttachmentUrl || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('[Modal Submit Error]:', err);
      const rawMsg = err.response?.data?.error || err.message || 'Failed to save announcement.';
      setErrorMsg(typeof rawMsg === 'string' ? rawMsg : 'Failed to save announcement.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-college-navy px-6 py-4 text-white flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg">
            {initialData ? 'Edit Announcement' : 'Post New Announcement'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs font-semibold rounded-lg border border-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Announcement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BMS Semester VI Internal Assessment Timetable"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-college-navy/40 focus:border-college-navy text-sm"
              required
            />
          </div>

          {/* Target Course Tags Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Courses (Select One or More) *
            </label>
            <div className="flex flex-wrap gap-2">
              {/* ALL button */}
              <button
                type="button"
                onClick={toggleAllCourses}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                  allCodesSelected
                    ? 'bg-college-gold text-college-navy border-college-gold ring-2 ring-college-navy/30 shadow-sm'
                    : 'bg-slate-200 text-slate-800 border-slate-400 hover:bg-slate-300'
                }`}
              >
                {allCodesSelected ? '✓ ALL' : '+ ALL'}
              </button>

              {/* Individual Course Buttons */}
              {availableCourseList.map((course) => {
                const isSelected = selectedCourses.includes(course.code);
                return (
                  <button
                    type="button"
                    key={course.code}
                    onClick={() => toggleCourseSelection(course.code)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                      isSelected
                        ? 'bg-college-navy text-college-gold border-college-navy ring-2 ring-college-gold/40 shadow-sm'
                        : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? `✓ ${course.code}` : `+ ${course.code}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Announcement Content *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Write notice details, instructions, room numbers, or deadline notes..."
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-college-navy/40 focus:border-college-navy text-sm leading-relaxed"
              required
            />
          </div>

          {/* File Upload (Cloudinary Signed Request) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Attachment Document (PDF, Image, Doc)
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-college-navy rounded-lg text-xs font-semibold border border-slate-300 transition-colors">
                <Upload className="w-4 h-4 text-college-navy" />
                <span>{fileToUpload ? 'Change File' : 'Choose File to Upload'}</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                />
              </label>
              {fileToUpload && (
                <div className="flex items-center space-x-1 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                  <FileCheck className="w-4 h-4" />
                  <span className="truncate max-w-xs">{fileToUpload.name}</span>
                </div>
              )}
              {attachmentUrl && !fileToUpload && (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 underline truncate max-w-xs"
                >
                  Existing Attachment
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Files are securely uploaded to Cloudinary via backend-signed signature.
            </p>
          </div>

          {/* Options: Pin & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPinnedCheck"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-college-navy rounded border-slate-300 focus:ring-college-navy"
              />
              <label htmlFor="isPinnedCheck" className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                Pin Announcement to Top of Feed
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Optional Expiration Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-college-navy/40 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="px-5 py-2 bg-college-navy hover:bg-college-navyLight text-college-gold font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-2"
            >
              {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{isUploading ? 'Uploading File...' : isSubmitting ? 'Saving...' : 'Publish Announcement'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementModal;
