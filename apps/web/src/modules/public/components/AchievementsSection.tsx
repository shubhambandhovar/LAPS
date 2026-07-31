import React from 'react';
import { motion } from 'framer-motion';
import { Section, Card } from '../../../components/public/ui';
import { Award, Trophy, Medal, Star } from 'lucide-react';

const achievements = [
  { title: 'Best School Award 2025', category: 'Academics', icon: Trophy, year: '2025', desc: 'Awarded by State Education Board for excellence in academics.' },
  { title: 'National Science Olympiad', category: 'Competition', icon: Award, year: '2024', desc: '5 Gold Medals won by our students at the national level.' },
  { title: 'State Basketball Champions', category: 'Sports', icon: Medal, year: '2025', desc: 'Our senior boys team clinched the state championship.' },
  { title: '100% Board Pass Rate', category: 'Academics', icon: Star, year: '2025', desc: 'Consistent 100% pass rate in Class X and XII for 5 consecutive years.' },
];

export const AchievementsSection: React.FC = () => {
  return (
    <Section animate className="py-20 bg-slate-50 border-y border-slate-100">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-4xl font-heading font-bold text-slate-900 mb-6">Our Proud Achievements</h2>
        <p className="text-lg text-slate-600">
          We celebrate the hard work and dedication of our students and staff who continuously strive for excellence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            >
              <Card hoverEffect className="h-full flex flex-col p-6 items-center text-center border-none shadow-md">
                <div className="w-16 h-16 rounded-full bg-secondary-100 text-secondary-600 flex items-center justify-center mb-6">
                  <Icon className="w-8 h-8" />
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{achievement.category} • {achievement.year}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{achievement.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{achievement.desc}</p>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
};
