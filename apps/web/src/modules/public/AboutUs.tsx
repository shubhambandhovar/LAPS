import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Section } from '../../components/public/ui';
import { motion } from 'framer-motion';

export const AboutUs: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>About Us | Little Angels School</title>
        <meta name="description" content="Learn about the history, vision, and mission of Little Angels School." />
      </Helmet>
      
      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">About Us</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">Discover our journey of excellence in education since 1995.</p>
      </div>

      <Section animate className="py-20">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Our Vision</h2>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
              To be a premier educational institution that fosters a culture of academic excellence, innovation, and holistic development, empowering students to become responsible global citizens and leaders of tomorrow.
            </p>

            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-lg text-slate-600 mb-12 leading-relaxed">
              Our mission is to provide a safe, inclusive, and stimulating learning environment that encourages curiosity, critical thinking, and creativity. We are committed to nurturing the intellectual, physical, emotional, and social well-being of every student through a balanced curriculum, dedicated faculty, and strong community partnerships.
            </p>
            
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Our History</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Founded in 1995, Little Angels School began with a simple vision: to provide quality education in a nurturing environment. Over the past three decades, we have grown from a small primary school to a comprehensive K-12 institution recognized for academic excellence.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Today, our sprawling campus features state-of-the-art facilities, modern laboratories, extensive sports grounds, and a dedicated team of educators who continue to uphold our founding principles while embracing modern educational methodologies.
            </p>
          </motion.div>
        </div>
      </Section>
    </>
  );
};
