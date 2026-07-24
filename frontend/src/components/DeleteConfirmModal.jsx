import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

export const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, isDeleting, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center space-x-3 text-rose-600 mb-4">
          <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg text-slate-900">Delete Announcement</h3>
            <p className="text-xs text-slate-500">This action cannot be undone.</p>
          </div>
        </div>

        <p className="text-sm text-slate-600 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200 italic">
          "{title}"
        </p>

        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
