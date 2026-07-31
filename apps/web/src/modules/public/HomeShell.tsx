import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPublicBanners, getPublicNews } from '../../api/public';
import {
  HeroSection,
  StatsSection,
  AboutSection,
  PrincipalMessage,
  AcademicsSection,
  FacilitiesSection,
  AchievementsSection,
  NewsEventsSection,
  GalleryPreview,
  TestimonialsSection,
  CampusVideo,
  AdmissionCTA,
  FAQSection
} from './components';

export const HomeShell: React.FC = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getPublicBanners(), getPublicNews()]).then(([bannersData, newsData]) => {
      if (bannersData) setBanners(bannersData.filter((b: any) => b.isActive).sort((a: any, b: any) => a.order - b.order));
      if (newsData) setNews(newsData.slice(0, 2)); // Show top 2 latest news on homepage
    }).catch(err => console.error("Failed to fetch home data", err));
  }, []);

  const heroBanner = banners.length > 0 ? banners[0] : null;

  return (
    <>
      <Helmet>
        <title>Home | Little Angels School, Gohad</title>
        <meta name="description" content="Little Angels School offers excellence in education, empowering students to achieve academic and personal growth." />
      </Helmet>
      
      <div className="flex flex-col min-h-screen">
        <HeroSection banner={heroBanner} />
        <AboutSection />
        <PrincipalMessage />
        <StatsSection />
        <AcademicsSection />
        <FacilitiesSection />
        <AchievementsSection />
        <NewsEventsSection news={news} />
        <GalleryPreview />
        <TestimonialsSection />
        <CampusVideo />
        <AdmissionCTA />
        <FAQSection />
      </div>
    </>
  );
};
