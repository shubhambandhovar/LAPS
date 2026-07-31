import React from 'react';
import { motion } from 'framer-motion';
import { Section, Button } from '../../../components/public/ui';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutSection: React.FC = () => {
  return (
    <Section animate className="py-20 md:py-28 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group">
            <img 
              src="https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop" 
              alt="Students learning" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply" />
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="absolute -bottom-10 -right-10 bg-white p-8 rounded-3xl shadow-xl max-w-xs hidden md:block"
          >
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-12 h-12 bg-accent-100 text-accent-600 rounded-full flex items-center justify-center">
                <span className="font-bold text-xl">30+</span>
              </div>
              <p className="font-heading font-bold text-slate-800 leading-tight">Years of Educational Excellence</p>
            </div>
            <p className="text-sm text-slate-500">Dedicated to nurturing young minds and building future leaders since 1995.</p>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 text-primary-700 font-semibold text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-primary-600 mr-2" />
            About Little Angels
          </div>
          
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-6 leading-tight">
            A Legacy of Learning, <br />
            <span className="text-primary-600">A Future of Success</span>
          </h2>
          
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            At Little Angels School, we believe in creating an environment where academic rigor meets holistic development. Our state-of-the-art campus, expert faculty, and student-centric approach ensure that every child reaches their full potential.
          </p>

          <div className="space-y-4 mb-10">
            {[
              "Holistic Development Curriculum",
              "Advanced Digital Classrooms",
              "Extensive Sports Facilities",
              "Personalized Mentorship"
            ].map((feature, idx) => (
              <div key={idx} className="flex items-center text-slate-700 font-medium">
                <CheckCircle2 className="w-6 h-6 text-success mr-3 flex-shrink-0" />
                {feature}
              </div>
            ))}
          </div>

          <Link to="/about">
            <Button size="lg" className="group">
              Read Our Full Story
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </Section>
  );
};
