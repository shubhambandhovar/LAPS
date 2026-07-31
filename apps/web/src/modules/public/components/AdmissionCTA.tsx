import React from 'react';
// import { motion } from 'framer-motion';
import { Section, Button } from '../../../components/public/ui';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowRight } from 'lucide-react';

export const AdmissionCTA: React.FC = () => {
  return (
    <Section animate className="py-24">
      <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 shadow-2xl">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop" 
            alt="Graduation" 
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 to-primary-900/40" />
        </div>

        <div className="relative z-10 p-12 md:p-20 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-sm mb-6">
              <GraduationCap className="w-4 h-4 mr-2" />
              Admissions Open 2026-27
            </div>
            
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 leading-tight">
              Begin Your Child's Journey to Excellence
            </h2>
            
            <p className="text-lg text-slate-300 leading-relaxed">
              Join the Little Angels family and give your child the foundation they need for a successful future. Our admissions process is transparent, merit-based, and designed to identify students who will thrive in our environment.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row md:flex-col gap-4">
            <Link to="/apply">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto md:w-full font-bold shadow-lg shadow-secondary-500/30 group">
                Apply for Admission
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/admissions">
              <Button size="lg" variant="outline" className="w-full sm:w-auto md:w-full text-white border-white hover:bg-white hover:text-primary-900">
                View Admission Policy
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Section>
  );
};
