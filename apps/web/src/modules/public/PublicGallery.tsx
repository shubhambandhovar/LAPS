import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPublicBanners } from '../../api/public';
import { Image as ImageIcon } from 'lucide-react';
import { Section } from '../../components/public/ui';
import { motion } from 'framer-motion';

export const PublicGallery: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicBanners()
      .then(data => {
        if (data) {
          const galleryImages = data.filter((item: any) => item.imageUrl);
          setImages(galleryImages);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Helmet>
        <title>Photo Gallery | Little Angels School</title>
        <meta name="description" content="View our campus photos, events, and activities." />
      </Helmet>

      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Photo Gallery</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">Glimpses of life, events, and campus facilities at Little Angels School.</p>
      </div>

      <Section animate className="py-20 min-h-[50vh]">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {images.length > 0 ? images.map((item, idx) => (
              <motion.div 
                key={item.id || idx} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative aspect-square bg-slate-200 rounded-2xl overflow-hidden shadow-md cursor-pointer"
              >
                <img 
                  src={item.imageUrl} 
                  alt={item.title || 'Gallery Image'} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  <h3 className="text-white font-bold text-lg leading-tight">{item.title}</h3>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <ImageIcon className="w-10 h-10 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Photos Yet</h3>
                <p>Check back later for updates to our gallery.</p>
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  );
};
