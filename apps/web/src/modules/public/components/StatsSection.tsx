import React, { useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { Users, BookOpen, Award, Building } from 'lucide-react';
import { Section } from '../../../components/public/ui';

const stats = [
  { id: 1, label: 'Happy Students', value: 2500, icon: Users },
  { id: 2, label: 'Expert Teachers', value: 150, icon: BookOpen },
  { id: 3, label: 'Awards Won', value: 85, icon: Award },
  { id: 4, label: 'Years of Excellence', value: 30, icon: Building },
];

const AnimatedCounter = ({ value }: { value: number }) => {
  const [count, setCount] = useState(0);
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const incrementTime = (duration / end) * 10;
      
      const timer = setInterval(() => {
        start += Math.ceil(end / 50);
        if (start > end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(start);
        }
      }, incrementTime);
      return () => clearInterval(timer);
    }
  }, [value, isInView]);

  return <span ref={ref}>{count}+</span>;
};

export const StatsSection: React.FC = () => {
  return (
    <Section variant="primary" animate className="py-12 md:py-16">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-4 text-white">
                <Icon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-heading font-bold mb-2">
                <AnimatedCounter value={stat.value} />
              </div>
              <p className="text-primary-100 font-medium">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>
    </Section>
  );
};
