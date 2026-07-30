import React, { useEffect, useState } from 'react';
import { getPublicBanners } from '../../api/public';
import { Image as ImageIcon } from 'lucide-react';

export const PublicGallery: React.FC = () => {
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For the gallery, we can use the banners or media assets
    // Since there's no dedicated public media endpoint yet, we'll use banners as a proxy for visual content
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
    <div className="bg-slate-50 min-h-[60vh] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Photo Gallery</h1>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Glimpses of life, events, and campus facilities at Little Angels School.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading gallery...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.length > 0 ? images.map((item, idx) => (
              <div key={item.id || idx} className="group relative aspect-square bg-slate-200 rounded-xl overflow-hidden shadow-sm cursor-pointer">
                <img 
                  src={item.imageUrl} 
                  alt={item.title || 'Gallery Image'} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <h3 className="text-white font-bold text-sm truncate">{item.title}</h3>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 border-dashed flex flex-col items-center justify-center">
                <ImageIcon className="w-12 h-12 text-slate-300 mb-4" />
                <p>No photos available in the gallery yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
