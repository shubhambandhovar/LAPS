import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/public/ui';
import { ArrowRight, Download, MapPin } from 'lucide-react';

interface HeroSectionProps {
  banner: any;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ banner }) => {
  return (
    <section className="relative w-full h-[90vh] min-h-[600px] flex items-center justify-center overflow-hidden bg-slate-900">
      {/* Background Image / Video */}
      {banner?.imageUrl ? (
        <motion.img 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
          src={banner.imageUrl} 
          alt={banner.title || 'Hero'} 
          className="absolute inset-0 w-full h-full object-cover opacity-50" 
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary-700 via-primary-500 to-accent-600 opacity-90" />
      )}
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

      {/* Floating Decorative Elements */}
      <motion.div 
        animate={{ y: [0, -20, 0] }} 
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
        className="absolute top-1/4 left-10 w-24 h-24 bg-secondary-500 rounded-full blur-3xl opacity-30"
      />
      <motion.div 
        animate={{ y: [0, 30, 0] }} 
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
        className="absolute bottom-1/4 right-10 w-32 h-32 bg-accent-500 rounded-full blur-3xl opacity-30"
      />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-semibold mb-6">
            Admissions Open 2026-27
          </span>
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-5xl md:text-7xl font-heading font-bold text-white mb-6 tracking-tight drop-shadow-xl"
        >
          {banner?.title || 'Empowering Minds, Shaping the Future'}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-lg md:text-2xl text-slate-200 mb-10 font-medium drop-shadow-sm max-w-3xl mx-auto leading-relaxed"
        >
          {banner?.subtitle || 'Excellence in Education since 1995. A nurturing environment for academic and personal growth.'}
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link to="/apply">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto font-bold group">
              Apply Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-primary-600">
              <MapPin className="ml-2 w-5 h-5 mr-2" /> Book Campus Visit
            </Button>
          </Link>
          <a href="/prospectus.pdf" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="ghost" className="w-full sm:w-auto text-white hover:bg-white/10">
              <Download className="ml-2 w-5 h-5 mr-2" /> Prospectus
            </Button>
          </a>
        </motion.div>
      </div>

      {/* Animated Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
      >
        <span className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-2">Scroll Explore</span>
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          className="w-1 h-8 rounded-full bg-gradient-to-b from-white/80 to-transparent"
        />
      </motion.div>
    </section>
  );
};
