import React from 'react';
import { motion } from 'framer-motion';
import { Section, Button } from '../../../components/public/ui';
import { Image as ImageIcon, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const galleryItems = [
  { id: 1, src: 'https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop', colSpan: 'col-span-12 md:col-span-8', rowSpan: 'row-span-2' },
  { id: 2, src: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop', colSpan: 'col-span-12 md:col-span-4', rowSpan: 'row-span-1' },
  { id: 3, src: 'https://images.unsplash.com/photo-1511629091441-ee46146481b6?q=80&w=2070&auto=format&fit=crop', colSpan: 'col-span-12 md:col-span-4', rowSpan: 'row-span-1' },
  { id: 4, src: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=2020&auto=format&fit=crop', colSpan: 'col-span-12 md:col-span-4', rowSpan: 'row-span-1' },
  { id: 5, src: 'https://images.unsplash.com/photo-1473649085228-583485e6e4d7?q=80&w=2088&auto=format&fit=crop', colSpan: 'col-span-12 md:col-span-8', rowSpan: 'row-span-1' },
];

export const GalleryPreview: React.FC = () => {
  return (
    <Section animate className="py-20 md:py-28 bg-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="max-w-2xl">
          <h2 className="text-4xl font-heading font-bold text-slate-900 mb-4">Campus Life Gallery</h2>
          <p className="text-lg text-slate-600">
            A glimpse into the vibrant events, activities, and everyday moments that make Little Angels School special.
          </p>
        </div>
        <Link to="/gallery">
          <Button variant="outline" className="group">
            View Full Gallery <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-12 gap-4 auto-rows-[250px]">
        {galleryItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`relative rounded-2xl overflow-hidden group cursor-pointer ${item.colSpan} ${item.rowSpan}`}
          >
            <img 
              src={item.src} 
              alt="Gallery Preview" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/40 transition-colors duration-300" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white">
                <ImageIcon className="w-8 h-8" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
};
