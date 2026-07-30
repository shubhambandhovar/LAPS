import React, { useEffect, useState } from 'react';
import { getPublicNotices } from '../../api/public';
import { Bell, Calendar, Download } from 'lucide-react';

export const PublicNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicNotices()
      .then(data => setNotices(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-50 min-h-[60vh] py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Public Notices</h1>
            <p className="text-slate-500 mt-1">Official circulars, announcements, and important updates</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading notices...</div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {notices.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {notices.map((notice) => (
                  <div key={notice.id} className="p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {notice.category || 'General'}
                          </span>
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(notice.publishedAt || notice.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                          {notice.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-4">{notice.content}</p>
                      </div>
                      
                      {notice.attachmentUrl && (
                        <div className="shrink-0">
                          <a 
                            href={notice.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 transition-colors shadow-sm"
                          >
                            <Download className="w-4 h-4" />
                            Download PDF
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-500">
                No public notices currently available.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
