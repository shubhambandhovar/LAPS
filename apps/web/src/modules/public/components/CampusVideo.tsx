import React from 'react';
import { motion } from 'framer-motion';
import { Section } from '../../../components/public/ui';
import { Play } from 'lucide-react';

export const CampusVideo: React.FC = () => {
  return (
    <Section animate className="py-20 bg-white">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-heading font-bold text-slate-900 mb-6">Take a Campus Tour</h2>
        <p className="text-lg text-slate-600">
          Experience the vibrant life at Little Angels School. From our modern classrooms to our extensive sports fields, see where our students grow and thrive.
        </p>
      </div>

      <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl aspect-video group cursor-pointer border border-slate-100">
        <img 
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop" 
          alt="Campus Tour Video Thumbnail" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-slate-900/30 group-hover:bg-slate-900/40 transition-colors" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg border border-white/50 group-hover:bg-white group-hover:text-primary-600 text-white transition-all duration-300"
          >
            <Play className="w-10 h-10 ml-2" />
          </motion.div>
        </div>
      </div>
    </Section>
  );
};
