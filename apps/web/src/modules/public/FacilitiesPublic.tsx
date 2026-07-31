import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Section } from '../../components/public/ui';
import { FacilitiesSection } from './components/FacilitiesSection';

export const FacilitiesPublic: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Campus Facilities | Little Angels School</title>
        <meta name="description" content="Explore the world-class campus facilities at Little Angels School." />
      </Helmet>
      
      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Campus Facilities</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">State-of-the-art infrastructure designed to support holistic development.</p>
      </div>

      <FacilitiesSection />
      
      <Section className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Safety & Security</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              The safety of our students is our top priority. Our campus is secured with 24/7 CCTV surveillance, restricted entry access, and a dedicated team of trained security personnel. 
            </p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Medical & Wellness</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              Our on-campus infirmary is staffed by a qualified nurse during school hours to handle any medical emergencies. We also conduct regular health check-ups and wellness workshops.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
};
