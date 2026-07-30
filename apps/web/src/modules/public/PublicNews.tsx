import React, { useEffect, useState } from 'react';
import { getPublicNews } from '../../api/public';
import { Calendar, ArrowRight, User } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PublicNews: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicNews()
      .then(data => setNews(data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-50 min-h-[60vh] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">News & Events</h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Stay updated with the latest happenings, announcements, and events at Little Angels School.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading news...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.length > 0 ? news.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                {item.image && (
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 mb-3">
                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {new Date(item.publishedAt || item.createdAt).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {item.author?.name || 'Admin'}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-600 line-clamp-3 mb-6 flex-grow">{item.content}</p>
                  <Link to={`/news/${item.id}`} className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 inline-flex items-center gap-1 mt-auto">
                    Read Full Story <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                No news or events found at the moment.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
