import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Section } from '../../components/public/ui';
import { AcademicsSection } from './components/AcademicsSection';

export const AcademicsPublic: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Academics | Little Angels School</title>
        <meta name="description" content="Explore the comprehensive academic programs offered at Little Angels School." />
      </Helmet>
      
      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Academic Programs</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">Nurturing intellectual curiosity and critical thinking across all age groups.</p>
      </div>

      <AcademicsSection />

      <Section variant="alternate">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Our Teaching Methodology</h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            We employ a blend of traditional and modern teaching methodologies. Our classrooms are equipped with digital smart boards to facilitate interactive learning. We emphasize experiential learning, project-based assignments, and collaborative group work to ensure students develop practical skills alongside theoretical knowledge.
          </p>
        </div>
      </Section>
    </>
  );
};
