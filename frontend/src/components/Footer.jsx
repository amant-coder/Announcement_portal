import React from 'react';
import { MapPin, Phone, Mail, Globe, ShieldCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-college-navy text-slate-300 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About College */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-college-gold"></span>
              Ghanshyamdas Saraf College
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering students through academic excellence in Commerce, Management, Arts, and Information Technology. Affiliated with the University of Mumbai.
            </p>
          </div>

          {/* Quick Info & Location */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-3">Campus Contact</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-college-gold shrink-0 mt-0.5" />
                <span>RSET Campus, Swami Vivekanand Road, Malad (West), Mumbai - 400064</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-college-gold shrink-0" />
                <span>+91 22 2882 1234 / 2882 5678</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-college-gold shrink-0" />
                <span>principal@sarafcollege.org</span>
              </li>
            </ul>
          </div>

          {/* System Info */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-3">Announcement Portal</h4>
            <p className="text-xs text-slate-400 mb-3">
              Official digital noticeboard for instant academic notices, timetable changes, exam schedules, and department circulars.
            </p>
            <div className="flex items-center space-x-2 text-xs text-college-gold bg-white/5 p-2.5 rounded-lg border border-white/10">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Public Student Access • Zero Authentication Required</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Ghanshyamdas Saraf College of Arts & Commerce. All rights reserved.</p>
          <p className="mt-2 md:mt-0">Designed & Maintained for Mumbai University Students</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
