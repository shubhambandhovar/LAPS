import React from 'react';
import { motion } from 'framer-motion';
import { Section } from '../../../components/public/ui';
import { Monitor, FlaskConical, Library, Bus, Trophy, HeartPulse } from 'lucide-react';

const facilities = [
  { title: 'Smart Classrooms', icon: Monitor, image: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2064&auto=format&fit=crop' },
  { title: 'Science & Computer Labs', icon: FlaskConical, image: 'https://images.unsplash.com/photo-1564069114553-7215e1ff1890?q=80&w=1932&auto=format&fit=crop' },
  { title: 'Library Resource Center', icon: Library, image: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Transport Fleet', icon: Bus, image: 'https://images.unsplash.com/photo-1557223562-6c77ef16210f?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Sports Complex', icon: Trophy, image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=2070&auto=format&fit=crop' },
  { title: 'Medical Room', icon: HeartPulse, image: 'https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=2070&auto=format&fit=crop' },
];

export const FacilitiesSection: React.FC = () => {
  return (
    <Section variant="alternate" animate className="py-20 md:py-28">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-heading font-bold text-slate-900 mb-6">World-Class Facilities</h2>
        <p className="text-lg text-slate-600">
          Our campus is equipped with modern infrastructure to support academic excellence and holistic development.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {facilities.map((facility, index) => {
          const Icon = facility.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group relative h-80 rounded-3xl overflow-hidden shadow-lg cursor-pointer"
            >
              <img 
                src={facility.image} 
                alt={facility.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="absolute bottom-0 left-0 right-0 p-8 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white">{facility.title}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
};
