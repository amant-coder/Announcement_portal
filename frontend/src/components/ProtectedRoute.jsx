import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { ShieldAlert, Clock, LogOut, CheckCircle2 } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useAuth();

  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-college-navy border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-600">Verifying HOD credentials...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/admin/login" replace />;
  }

  // Check HOD approval status from Clerk publicMetadata
  const isApproved = user?.publicMetadata?.isApproved === true;

  if (!isApproved) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-4">
        <div className="bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
          <div className="bg-amber-500 text-white p-6 flex items-center space-x-3">
            <Clock className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-lg font-heading font-bold">HOD Account Pending Approval</h2>
              <p className="text-xs text-amber-100">Ghanshyamdas Saraf College Administrator Verification Required</p>
            </div>
          </div>

          <div className="p-6 space-y-4 text-slate-700">
            <p className="text-sm leading-relaxed">
              Hello <strong className="text-slate-900">{user.fullName || user.emailAddresses[0]?.emailAddress}</strong>, your account has been registered successfully as a Department Head.
            </p>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Security Policy Notice
              </div>
              <p>
                In compliance with Mumbai University digital security guidelines, new HOD accounts start in an unapproved state (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono">isApproved: false</code>). Server-side posting privileges are disabled until verified.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">How to get your account approved:</h4>
              <ul className="text-xs space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Provide your Clerk User ID <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono select-all">{user.id}</code> to the Super Admin.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>The Super Admin can run the approval script or execute the protected approval route.</span>
                </li>
              </ul>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <span className="text-xs text-slate-500">Status: <strong className="text-amber-600">Pending Approval</strong></span>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center space-x-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
