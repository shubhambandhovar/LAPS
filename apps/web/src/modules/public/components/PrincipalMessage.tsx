import React from 'react';
import { motion } from 'framer-motion';
import { Section } from '../../../components/public/ui';
import { Quote } from 'lucide-react';

export const PrincipalMessage: React.FC = () => {
  return (
    <Section variant="alternate" animate className="py-20 md:py-28 relative overflow-hidden">
      
      {/* Decorative background blob */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-100 rounded-full blur-3xl opacity-50 transform translate-x-1/3 -translate-y-1/3 pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-8 md:p-16 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="flex-shrink-0 relative"
          >
            <div className="w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-primary-50 shadow-2xl relative z-10">
              <img 
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop" 
                alt="Principal" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Accent badge */}
            <div className="absolute -bottom-6 -right-6 bg-accent-500 text-white w-24 h-24 rounded-full flex items-center justify-center shadow-lg z-20">
              <Quote className="w-10 h-10 fill-current" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex-grow text-center lg:text-left"
          >
            <h3 className="text-3xl md:text-4xl font-heading font-bold text-primary-700 mb-2">Message from the Principal</h3>
            <p className="text-accent-600 font-semibold mb-8 uppercase tracking-wider text-sm">Dr. Arthur Pendelton</p>
            
            <div className="relative">
              <Quote className="absolute -top-6 -left-8 w-16 h-16 text-slate-100 -z-10 transform rotate-180" />
              <p className="text-xl md:text-2xl text-slate-600 italic leading-relaxed mb-8">
                "Our mission is to ignite a passion for lifelong learning. We strive to provide a secure and stimulating environment where children can develop intellectually, socially, and emotionally. At Little Angels, we don't just teach; we inspire."
              </p>
            </div>
            
            <div className="mt-8">
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Signature_of_John_Hancock.svg" alt="Signature" className="h-12 mx-auto lg:mx-0 opacity-60" />
            </div>
          </motion.div>
          
        </div>
      </div>
    </Section>
  );
};
