import React, { useEffect, useState } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { getPublicPage } from '../../api/public';

export const CmsPageViewer: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    
    setLoading(true);
    getPublicPage(slug)
      .then((data) => {
        if (data) {
          setPage(data);
          setError(false);
          // Set Document Title
          document.title = data.seoMetadata?.title || `${data.title} - Little Angels School`;
          
          // Set Meta Description
          if (data.seoMetadata?.description) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', data.seoMetadata.description);
          }
        } else {
          setError(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load page', err);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
      
    return () => {
      document.title = 'Little Angels School';
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 min-h-[60vh] flex items-center justify-center">
        <div className="text-slate-500 flex flex-col items-center">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p>Loading {slug}...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="bg-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            {page.title}
          </h1>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* We use dangerouslySetInnerHTML to render the HTML. In a real app, markdown needs parsing. 
            Assuming the CMS content is HTML or we're just rendering text for now.
            If it's markdown, we'd need a markdown parser like marked or react-markdown. 
            For this shell, we will just render it as white-space pre-wrap text. */}
        <div className="prose prose-indigo max-w-none text-slate-700 whitespace-pre-wrap">
          {page.content}
        </div>
      </div>
    </div>
  );
};
