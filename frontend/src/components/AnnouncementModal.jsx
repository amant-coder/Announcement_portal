import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { X, Upload, Pin, Calendar, AlertCircle, Loader2, FileCheck, Save, Lock, Bell, Clock, Trash2, Plus, TableProperties } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFile } from '../services/upload';

export const AnnouncementModal = ({ isOpen, onClose, onSave, initialData = null, courses = [] }) => {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [status, setStatus] = useState('PUBLISHED');
  const [type, setType] = useState('NOTICE');

  const [timetableEntries, setTimetableEntries] = useState([{ subject: '', date: '', time: '', room: '' }]);
  const [showPasteParser, setShowPasteParser] = useState(false);
  const [pasteData, setPasteData] = useState('');

  const [fileToUpload, setFileToUpload] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract allowed courses for this HOD from Clerk publicMetadata
  const userAllowedCourses = user?.publicMetadata?.allowedCourses;
  const isRestrictedHod = Array.isArray(userAllowedCourses) && !userAllowedCourses.includes('*');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setContent(initialData.content || '');
      setSelectedCourses(initialData.courseCodes || []);
      setIsPinned(initialData.isPinned || false);
      setAttachmentUrl(initialData.attachmentUrl || '');
      setExpiresAt(initialData.expiresAt ? new Date(initialData.expiresAt).toISOString().split('T')[0] : '');
      setStatus(initialData.status || 'PUBLISHED');
      setType(initialData.type || 'NOTICE');
      
      if (initialData.type === 'TIMETABLE' && initialData.timetableEntries?.length > 0) {
        setTimetableEntries(initialData.timetableEntries.map(e => ({
          subject: e.subject || '',
          date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
          time: e.time || '',
          room: e.room || ''
        })));
      } else {
        setTimetableEntries([{ subject: '', date: '', time: '', room: '' }]);
      }
    } else {
      setTitle('');
      setContent('');
      // If HOD is restricted to specific courses, auto-select their allowed courses
      if (isRestrictedHod) {
        setSelectedCourses(userAllowedCourses);
      } else {
        setSelectedCourses([]);
      }
      setIsPinned(false);
      setAttachmentUrl('');
      setExpiresAt('');
      setStatus('PUBLISHED');
      setType('NOTICE');
      setTimetableEntries([{ subject: '', date: '', time: '', room: '' }]);
    }
    setFileToUpload(null);
    setErrorMsg('');
    setShowPasteParser(false);
    setPasteData('');
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const rawCourseList = courses && courses.length > 0
    ? courses
    : [
      { code: 'BCOM' }, { code: 'BAF' }, { code: 'BBI' }, { code: 'BFM' },
      { code: 'BMS' }, { code: 'BSCIT' }, { code: 'BMM' }, { code: 'BA' }, { code: 'BSC' },
    ];

  // Filter available courses based on HOD permissions
  const availableCourseList = isRestrictedHod
    ? rawCourseList.filter((c) => userAllowedCourses.includes(c.code))
    : rawCourseList;

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

  const handleParsePaste = () => {
    if (!pasteData.trim()) return;
    const lines = pasteData.trim().split('\n');
    const newEntries = lines.map(line => {
      const parts = line.split(/\t/);
      return {
        date: parts[0]?.trim() || '',
        subject: parts[1]?.trim() || '',
        time: parts[2]?.trim() || '',
        room: parts[3]?.trim() || '',
      };
    });
    setTimetableEntries(newEntries);
    setShowPasteParser(false);
    setPasteData('');
  };

  const handleSubmit = async (e, forcedStatus = null) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Announcement title is required.');
      return;
    }
    
    if (type === 'TIMETABLE') {
      for (const entry of timetableEntries) {
        if (!entry.subject.trim() || !entry.date || !entry.time.trim()) {
          setErrorMsg('Subject, Date, and Time are required for all timetable entries.');
          return;
        }
      }
    } else {
      if (!content.trim() || content === '<p><br></p>') {
        setErrorMsg('Announcement content is required.');
        return;
      }
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
        finalAttachmentUrl = await uploadFile(fileToUpload, getToken);
        setIsUploading(false);
      }

      const payload = {
        title: title.trim(),
        content: type === 'TIMETABLE' ? ' ' : content.trim(),
        courseCodes: selectedCourses,
        isPinned,
        attachmentUrl: finalAttachmentUrl || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        status: forcedStatus || status,
        type,
        timetableEntries: type === 'TIMETABLE' ? timetableEntries.map(e => ({
          ...e,
          date: new Date(e.date).toISOString()
        })) : undefined,
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
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-in fade-in zoom-in duration-150">
        {/* Modal Header */}
        <div className="bg-college-navy px-6 py-4 text-white flex items-center justify-between">
          <h2 className="font-heading font-bold text-lg">
            {initialData ? 'Edit Post' : 'Post Announcement / Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 transition-colors duration-300">
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Post Category Selection: Academic Notice vs College Event */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Post Type / Category *
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setType('NOTICE')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-2 ${
                  type === 'NOTICE'
                    ? 'bg-college-navy text-college-gold border-college-navy shadow-sm ring-2 ring-college-gold/40'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Bell className="w-4 h-4 text-sky-400" />
                <span>Academic Notice</span>
              </button>

              <button
                type="button"
                onClick={() => setType('EVENT')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-2 ${
                  type === 'EVENT'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/40'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                <span>College Event</span>
              </button>

              <button
                type="button"
                onClick={() => setType('TIMETABLE')}
                className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center space-x-2 ${
                  type === 'TIMETABLE'
                    ? 'bg-college-navy text-white border-college-navy shadow-sm ring-2 ring-college-navy/40'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Exam Timetable</span>
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Announcement Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. BMS Semester VI Internal Assessment Timetable"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-college-navy/40 dark:focus:ring-college-gold/40 focus:border-college-navy dark:focus:border-college-gold text-sm"
              required
            />
          </div>

          {/* Department / Course Tags Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Department / Course *
              </label>
              {isRestrictedHod && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Restricted to {userAllowedCourses.join(', ')}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Individual Course Buttons */}
              {availableCourseList.map((course) => {
                const isSelected = selectedCourses.includes(course.code);
                return (
                  <button
                    type="button"
                    key={course.code}
                    onClick={() => toggleCourseSelection(course.code)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${isSelected
                        ? 'bg-college-navy text-college-gold border-college-navy ring-2 ring-college-gold/40 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-500'
                      }`}
                  >
                    {isSelected ? `✓ ${course.code}` : `+ ${course.code}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Textarea OR Timetable Editor */}
          {type === 'TIMETABLE' ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  EXAM SCHEDULE *
                </label>
                <button
                  type="button"
                  onClick={() => setShowPasteParser(!showPasteParser)}
                  className="text-xs text-college-navy dark:text-sky-400 hover:underline font-semibold flex items-center gap-1"
                >
                  <TableProperties className="w-3.5 h-3.5" />
                  Paste from Spreadsheet
                </button>
              </div>
              
              {showPasteParser && (
                <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Paste columns in order: <strong>Date | Subject | Time | Room</strong> (tab-separated)
                  </p>
                  <textarea
                    value={pasteData}
                    onChange={(e) => setPasteData(e.target.value)}
                    placeholder="Paste rows here..."
                    className="w-full h-24 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-college-navy/40"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowPasteParser(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-200 hover:bg-slate-300 rounded-lg dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleParsePaste}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-college-navy hover:bg-college-navy/90 rounded-lg"
                    >
                      Import Rows
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                <div className="grid grid-cols-[1fr_2fr_1.5fr_1fr_auto] gap-2 p-3 border-b border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <div>Date</div>
                  <div>Subject / Paper</div>
                  <div>Time</div>
                  <div>Room (Opt)</div>
                  <div className="w-8"></div>
                </div>
                
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {timetableEntries.map((entry, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_2fr_1.5fr_1fr_auto] gap-2 p-2 items-start bg-white dark:bg-slate-800">
                      <input
                        type="date"
                        value={entry.date}
                        onChange={(e) => {
                          const newEntries = [...timetableEntries];
                          newEntries[idx].date = e.target.value;
                          setTimetableEntries(newEntries);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={entry.subject}
                        placeholder="Subject name"
                        onChange={(e) => {
                          const newEntries = [...timetableEntries];
                          newEntries[idx].subject = e.target.value;
                          setTimetableEntries(newEntries);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={entry.time}
                        placeholder="e.g. 10:00 - 12:00"
                        onChange={(e) => {
                          const newEntries = [...timetableEntries];
                          newEntries[idx].time = e.target.value;
                          setTimetableEntries(newEntries);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <input
                        type="text"
                        value={entry.room}
                        placeholder="Room"
                        onChange={(e) => {
                          const newEntries = [...timetableEntries];
                          newEntries[idx].room = e.target.value;
                          setTimetableEntries(newEntries);
                        }}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => setTimetableEntries(timetableEntries.filter((_, i) => i !== idx))}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded mt-0.5 transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                
                <div className="p-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setTimetableEntries([...timetableEntries, { subject: '', date: '', time: '', room: '' }])}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-college-navy dark:text-sky-400 bg-sky-50 dark:bg-sky-900/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Exam Date
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Announcement Content *
              </label>
              <div className="rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  placeholder="Write notice details, instructions, room numbers, or deadline notes..."
                  className="bg-white dark:bg-slate-700 min-h-[150px] dark:[&_.ql-toolbar]:bg-slate-600 dark:[&_.ql-toolbar]:border-slate-600 dark:[&_.ql-container]:border-slate-600 dark:[&_.ql-editor]:text-slate-100 dark:[&_.ql-editor.ql-blank]:before:text-slate-400 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-label]:text-slate-300 dark:[&_.ql-picker-options]:bg-slate-700 dark:[&_.ql-picker-options]:border-slate-600"
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                      ['link', 'clean']
                    ],
                  }}
                />
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Attachment Document (PDF, Image, Doc)
            </label>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-college-navy dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-600 transition-colors">
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
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Files are securely uploaded via the backend.
            </p>
          </div>

          {/* Options: Pin & Expiry Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPinnedCheck"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="w-4 h-4 text-college-navy rounded border-slate-300 focus:ring-college-navy"
              />
              <label htmlFor="isPinnedCheck" className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Pin className="w-3.5 h-3.5 text-amber-500" />
                Pin Announcement to Top of Feed
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Optional Expiration Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-college-navy/40 dark:focus:ring-college-gold/40 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'DRAFT')}
                disabled={isSubmitting || isUploading}
                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-xs transition-shadow shadow-sm flex items-center gap-2"
              >
                {(isSubmitting || isUploading) && status === 'DRAFT' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save as Draft</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, 'PUBLISHED')}
                disabled={isSubmitting || isUploading}
                className="px-5 py-2 bg-college-navy hover:bg-college-navyLight text-college-gold font-bold rounded-lg text-xs transition-all shadow-sm flex items-center gap-2"
              >
                {(isSubmitting || isUploading) && status === 'PUBLISHED' ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>{isUploading ? 'Uploading File...' : isSubmitting ? 'Saving...' : 'Publish Announcement'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementModal;
