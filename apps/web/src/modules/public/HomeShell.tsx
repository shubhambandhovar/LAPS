import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicBanners, getPublicNews } from '../../api/public';
import { ArrowRight, BookOpen, Users, Award, Calendar } from 'lucide-react';

export const HomeShell: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getPublicBanners(), getPublicNews()]).then(([bannersData, newsData]) => {
      if (bannersData) setBanners(bannersData.filter((b: any) => b.isActive).sort((a: any, b: any) => a.order - b.order));
      if (newsData) setNews(newsData.slice(0, 3)); // Only show top 3 latest news
    }).catch(err => console.error("Failed to fetch home data", err));
  }, []);

  const heroBanner = banners.length > 0 ? banners[0] : null;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden bg-slate-900">
        {heroBanner?.imageUrl ? (
          <img 
            src={heroBanner.imageUrl} 
            alt={heroBanner.title} 
            className="absolute inset-0 w-full h-full object-cover opacity-60" 
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-900 to-slate-900 opacity-90" />
        )}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight drop-shadow-md">
            {heroBanner?.title || 'Welcome to Little Angels School'}
          </h1>
          <p className="text-lg md:text-2xl text-slate-200 mb-10 font-medium drop-shadow-sm">
            Empowering Minds, Shaping the Future. Excellence in Education since 1995.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {heroBanner?.linkUrl ? (
              <a href={heroBanner.linkUrl} className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg">
                Learn More
              </a>
            ) : (
              <Link to="/admissions" className="px-8 py-4 bg-white text-indigo-900 font-bold rounded-full hover:bg-slate-100 transition-colors shadow-lg">
                Admission Enquiry
              </Link>
            )}
            <Link to="/portal" className="px-8 py-4 border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors">
              Student Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Highlights Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why Choose Us?</h2>
            <div className="mt-2 w-24 h-1 bg-indigo-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-slate-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow border border-slate-100">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Academic Excellence</h3>
              <p className="text-slate-600 leading-relaxed">
                Comprehensive curriculum designed to foster critical thinking, creativity, and a lifelong love for learning.
              </p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow border border-slate-100">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Expert Faculty</h3>
              <p className="text-slate-600 leading-relaxed">
                Dedicated and experienced teachers who provide personalized attention to nurture every student's potential.
              </p>
            </div>
            
            <div className="bg-slate-50 p-8 rounded-2xl text-center hover:shadow-lg transition-shadow border border-slate-100">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-3">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Holistic Development</h3>
              <p className="text-slate-600 leading-relaxed">
                Balanced focus on academics, sports, arts, and character building for all-round personality development.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest News & Events Preview */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">Latest Updates</h2>
              <p className="text-slate-500 mt-2">News and events from our school community</p>
            </div>
            <Link to="/news" className="hidden sm:flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {news.length > 0 ? news.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md transition-shadow flex flex-col">
                {item.image && (
                  <div className="h-48 bg-slate-100 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex-grow flex flex-col">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-grow">{item.content}</p>
                  <Link to={`/news/${item.id}`} className="text-indigo-600 font-semibold text-sm hover:text-indigo-700 inline-flex items-center gap-1 mt-auto">
                    Read More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed">
                No recent updates available at the moment.
              </div>
            )}
          </div>
          
          <div className="mt-8 text-center sm:hidden">
            <Link to="/news" className="inline-flex items-center gap-2 text-indigo-600 font-semibold hover:text-indigo-700">
              View All Updates <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
