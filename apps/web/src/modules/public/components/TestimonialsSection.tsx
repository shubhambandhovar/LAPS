import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../../../components/public/ui';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    content: "The transformation in my child since joining Little Angels has been remarkable. The teachers genuinely care about holistic development, not just grades.",
    author: "Priya Sharma",
    role: "Parent of Class X Student",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1974&auto=format&fit=crop"
  },
  {
    id: 2,
    content: "The advanced laboratories and interactive smart classes make learning complex science concepts incredibly engaging and easy to understand.",
    author: "Rahul Verma",
    role: "Alumnus, Batch of 2024",
    image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=1974&auto=format&fit=crop"
  },
  {
    id: 3,
    content: "I appreciate the balance between academics and sports. The school provides excellent coaching which helped me reach state-level competitions.",
    author: "Sneha Patel",
    role: "Student, Class XII",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2070&auto=format&fit=crop"
  }
];

export const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <Section variant="primary" animate className="py-20 md:py-28 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-400 rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500 rounded-full blur-3xl opacity-30" />

      <div className="text-center max-w-3xl mx-auto mb-16 relative z-10">
        <h2 className="text-4xl font-heading font-bold text-white mb-6">What Our Community Says</h2>
        <p className="text-lg text-primary-100">
          Hear from the parents, students, and alumni who make Little Angels School a vibrant learning community.
        </p>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="relative bg-white rounded-3xl p-8 md:p-12 shadow-2xl">
          <Quote className="absolute top-8 left-8 w-12 h-12 text-primary-100" />
          
          <div className="relative min-h-[250px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="text-center px-4 md:px-12"
              >
                <div className="flex justify-center mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-secondary-500 fill-current mx-1" />
                  ))}
                </div>
                <p className="text-xl md:text-2xl text-slate-700 font-medium leading-relaxed mb-8 relative z-10">
                  "{testimonials[currentIndex].content}"
                </p>
                <div className="flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-4 border-4 border-primary-50">
                    <img src={testimonials[currentIndex].image} alt={testimonials[currentIndex].author} className="w-full h-full object-cover" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">{testimonials[currentIndex].author}</h4>
                  <p className="text-sm text-slate-500">{testimonials[currentIndex].role}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between px-4 md:-mx-6 pointer-events-none">
            <button 
              onClick={handlePrevious}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-500 hover:bg-primary-50 hover:scale-110 transition-all pointer-events-auto border border-slate-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button 
              onClick={handleNext}
              className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-primary-500 hover:bg-primary-50 hover:scale-110 transition-all pointer-events-auto border border-slate-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </Section>
  );
};
