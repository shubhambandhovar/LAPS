import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPublicNews } from '../../api/public';
import { Newspaper, Calendar } from 'lucide-react';
import { Section, Card, Button } from '../../components/public/ui';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const PublicNews: React.FC = () => {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicNews()
      .then(data => {
        if (data) setNews(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>News & Events | Little Angels School</title>
        <meta name="description" content="Latest news, announcements, and events at Little Angels School." />
      </Helmet>

      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">News & Updates</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">Stay informed with the latest happenings in our school community.</p>
      </div>

      <Section animate className="py-20 min-h-[50vh]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.length > 0 ? news.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card hoverEffect className="h-full flex flex-col group border-none shadow-md">
                  {item.image && (
                    <div className="h-56 overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-8 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary-600 mb-4 uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-4 line-clamp-2">{item.title}</h3>
                    <p className="text-slate-600 line-clamp-3 mb-8 flex-grow leading-relaxed">{item.content}</p>
                    <Link to={`/news/${item.id}`} className="mt-auto">
                      <Button variant="outline" className="w-full">Read Full Article</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mb-6">
                  <Newspaper className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No News Found</h3>
                <p>Check back later for updates and announcements.</p>
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  );
};
