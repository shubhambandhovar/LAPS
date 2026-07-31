import React from 'react';
import { motion } from 'framer-motion';
import { Section, Card, Button } from '../../../components/public/ui';
import { ArrowRight, Calendar, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NewsEventsSectionProps {
  news: any[];
}

export const NewsEventsSection: React.FC<NewsEventsSectionProps> = ({ news }) => {
  return (
    <Section animate className="py-20 md:py-28">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* Latest News */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-slate-900">Latest News</h2>
              <p className="text-slate-500 mt-2">Updates from our school community</p>
            </div>
            <Link to="/news" className="hidden sm:block">
              <Button variant="ghost" className="group">
                View All <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {news.length > 0 ? news.map((item: any, index: number) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <Card hoverEffect className="h-full flex flex-col group border-none shadow-md">
                  {item.image && (
                    <div className="h-48 overflow-hidden">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-6 flex-grow flex flex-col">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary-600 mb-3 uppercase tracking-wider">
                      <Calendar className="w-4 h-4" />
                      {new Date(item.publishedAt || item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-slate-600 line-clamp-3 mb-6 flex-grow">{item.content}</p>
                    <Link to={`/news/${item.id}`} className="text-secondary-500 font-semibold text-sm hover:text-secondary-600 inline-flex items-center gap-1 mt-auto group/link">
                      Read More <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )) : (
              <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 rounded-3xl border border-slate-200 border-dashed">
                No recent updates available at the moment.
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="lg:col-span-1">
          <div className="mb-8">
            <h2 className="text-3xl font-heading font-bold text-slate-900">Upcoming Events</h2>
            <p className="text-slate-500 mt-2">Mark your calendars</p>
          </div>

          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
            <div className="space-y-6">
              {[
                { date: '15 Aug', title: 'Independence Day Celebration', time: '08:00 AM', loc: 'Main Ground' },
                { date: '05 Sep', title: 'Teachers Day Special Assembly', time: '10:00 AM', loc: 'Auditorium' },
                { date: '20 Sep', title: 'Inter-School Debate Competition', time: '09:30 AM', loc: 'Seminar Hall' },
                { date: '10 Oct', title: 'Annual Sports Meet 2026', time: '08:00 AM', loc: 'Sports Complex' },
              ].map((event, index) => (
                <div key={index} className="flex gap-4 group cursor-pointer">
                  <div className="flex-shrink-0 w-16 h-16 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-primary-600 group-hover:bg-primary-500 group-hover:text-white group-hover:border-primary-500 transition-colors">
                    <span className="text-xs font-bold uppercase">{event.date.split(' ')[1]}</span>
                    <span className="text-xl font-black leading-none">{event.date.split(' ')[0]}</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{event.title}</h4>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <Calendar className="w-3 h-3 mr-1" /> {event.time}
                      <span className="mx-2">•</span>
                      <MapPin className="w-3 h-3 mr-1" /> {event.loc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <Link to="/calendar" className="mt-8 block text-center">
              <Button variant="outline" className="w-full">View Full Calendar</Button>
            </Link>
          </div>
        </div>

      </div>
    </Section>
  );
};
