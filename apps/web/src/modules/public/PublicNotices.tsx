import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPublicNotices } from '../../api/public';
import { Bell, Download, FileText } from 'lucide-react';
import { Section, Card } from '../../components/public/ui';
import { motion } from 'framer-motion';

export const PublicNotices: React.FC = () => {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicNotices()
      .then(data => {
        if (data) setNotices(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Notices & Circulars | Little Angels School</title>
        <meta name="description" content="Important notices, circulars, and announcements for students and parents." />
      </Helmet>

      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Notices & Circulars</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">Important announcements and official communications.</p>
      </div>

      <Section animate className="py-20 min-h-[50vh]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {notices.length > 0 ? notices.map((notice, idx) => (
              <motion.div
                key={notice.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card hoverEffect className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start border-none shadow-md bg-white">
                  <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-secondary-50 border border-secondary-100 flex flex-col items-center justify-center text-secondary-600">
                    <span className="text-xs font-bold uppercase">{new Date(notice.publishedAt || notice.createdAt).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-2xl font-black leading-none">{new Date(notice.publishedAt || notice.createdAt).toLocaleDateString('en-US', { day: '2-digit' })}</span>
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{notice.title}</h3>
                      {notice.isPriority && (
                        <span className="px-2.5 py-0.5 rounded-full bg-danger/10 text-danger text-xs font-bold uppercase tracking-wider">Urgent</span>
                      )}
                    </div>
                    <p className="text-slate-600 leading-relaxed mb-4">{notice.content}</p>
                    
                    {notice.attachmentUrl && (
                      <a href={notice.attachmentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-200 transition-colors text-sm font-semibold group">
                        <FileText className="w-4 h-4 mr-2 text-slate-400 group-hover:text-primary-500" />
                        View Attachment
                        <Download className="w-4 h-4 ml-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    )}
                  </div>
                </Card>
              </motion.div>
            )) : (
              <div className="py-20 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                  <Bell className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Active Notices</h3>
                <p>There are currently no active notices or circulars to display.</p>
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  );
};
