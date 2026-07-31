import React from 'react';
import { motion } from 'framer-motion';
import { Section, Card, Button } from '../../../components/public/ui';
import { ArrowRight, BookOpen, BrainCircuit, Globe, Beaker } from 'lucide-react';
import { Link } from 'react-router-dom';

const programs = [
  {
    id: 'pre-primary',
    title: 'Pre-Primary',
    ages: '3-5 Years',
    icon: BrainCircuit,
    description: 'Play-based learning focusing on cognitive and motor skill development in a safe, nurturing environment.',
    color: 'bg-pink-100 text-pink-600'
  },
  {
    id: 'primary',
    title: 'Primary',
    ages: '6-10 Years',
    icon: BookOpen,
    description: 'Building strong foundational skills in literacy, numeracy, and environmental awareness.',
    color: 'bg-emerald-100 text-emerald-600'
  },
  {
    id: 'middle',
    title: 'Middle School',
    ages: '11-14 Years',
    icon: Globe,
    description: 'Encouraging independent thinking, project-based learning, and broad subject exploration.',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    id: 'senior',
    title: 'Senior Secondary',
    ages: '15-18 Years',
    icon: Beaker,
    description: 'Rigorous academic preparation for board exams and future career pathways with specialized streams.',
    color: 'bg-purple-100 text-purple-600'
  }
];

export const AcademicsSection: React.FC = () => {
  return (
    <Section animate className="py-20 md:py-28 bg-white">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-heading font-bold text-slate-900 mb-6">Academic Programs</h2>
        <p className="text-lg text-slate-600">
          Our curriculum is thoughtfully structured across four tiers to provide age-appropriate learning experiences that foster growth at every stage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {programs.map((program, index) => {
          const Icon = program.icon;
          return (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
            >
              <Card hoverEffect className="h-full flex flex-col border-none shadow-md bg-slate-50">
                <div className="p-8 flex-grow">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${program.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="text-sm font-bold text-primary-600 mb-2 uppercase tracking-wider">{program.ages}</div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{program.title}</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {program.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center mt-12">
        <Link to="/academics">
          <Button variant="outline" size="lg" className="group">
            Explore Curriculum 
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </Link>
      </div>
    </Section>
  );
};
