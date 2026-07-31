import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Section } from '../../../components/public/ui';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "What is the admission process for new students?",
    answer: "Our admission process is transparent and merit-based. It begins with submitting an online application, followed by an entrance assessment (for Grade 1 and above) and an interactive session with the parents and child."
  },
  {
    question: "Do you provide school transport facilities?",
    answer: "Yes, we have a fleet of modern, GPS-enabled buses that cover most areas of the city. All our buses are equipped with CCTV cameras and have trained attendants for student safety."
  },
  {
    question: "What extracurricular activities are available?",
    answer: "We offer a wide range of extracurricular activities including sports (basketball, football, cricket), performing arts (music, dance, drama), fine arts, robotics, and various academic clubs."
  },
  {
    question: "What is the student-teacher ratio?",
    answer: "We maintain an optimal student-teacher ratio of 25:1 to ensure personalized attention and effective learning for every child in the classroom."
  },
  {
    question: "Are parents involved in the school community?",
    answer: "Absolutely! We believe education is a partnership between the school and parents. We have an active Parent-Teacher Association (PTA) and organize regular PTMs and workshops for parents."
  }
];

export const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <Section animate className="py-20 md:py-28 bg-slate-50 border-t border-slate-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        
        <div className="lg:col-span-5">
          <div className="w-16 h-16 rounded-2xl bg-secondary-100 text-secondary-600 flex items-center justify-center mb-6">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h2 className="text-4xl font-heading font-bold text-slate-900 mb-6 leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            Find answers to common questions about our admission process, facilities, and academic programs.
          </p>
          <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-2">Still have questions?</h4>
            <p className="text-sm text-slate-500 mb-4">We're here to help. Contact our admissions office for personalized assistance.</p>
            <p className="font-semibold text-primary-600">+91 98765 43210</p>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          {faqs.map((faq, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className={`text-lg font-bold ${openIndex === index ? 'text-primary-600' : 'text-slate-800'}`}>
                  {faq.question}
                </span>
                <ChevronDown className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180 text-primary-600' : 'text-slate-400'}`} />
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-slate-600 leading-relaxed border-t border-slate-50 pt-4">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

      </div>
    </Section>
  );
};
