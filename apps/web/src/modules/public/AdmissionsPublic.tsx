import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Section, Button, Card } from '../../components/public/ui';
import { FileText, Users, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdmissionsPublic: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Admissions | Little Angels School</title>
        <meta name="description" content="Information about the admission process, policy, and requirements at Little Angels School." />
      </Helmet>
      
      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Admissions</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">Join the Little Angels family. Admissions open for 2026-27.</p>
      </div>

      <Section animate className="py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-6">Admission Process</h2>
          <p className="text-lg text-slate-600">
            Our admission process is designed to be simple, transparent, and parent-friendly. Follow these simple steps to enroll your child.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
          {[
            { step: '01', title: 'Registration', desc: 'Fill the online application form and pay the registration fee.', icon: FileText },
            { step: '02', title: 'Assessment', desc: 'Child participates in a brief interactive session/assessment.', icon: Users },
            { step: '03', title: 'Interaction', desc: 'Meeting with the Principal to understand mutual expectations.', icon: Calendar },
            { step: '04', title: 'Enrollment', desc: 'Submit required documents and pay admission fees to secure the seat.', icon: CheckCircle },
          ].map((item, index) => (
            <div key={index} className="relative flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-primary-100 flex items-center justify-center text-primary-600 mb-6 z-10">
                <item.icon className="w-10 h-10" />
              </div>
              <div className="absolute top-10 left-1/2 w-full h-0.5 bg-primary-100 -z-0 hidden md:block" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/apply">
            <Button size="lg" className="w-full sm:w-auto">Apply Online Now</Button>
          </Link>
          <a href="/prospectus.pdf" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">Download Prospectus</Button>
          </a>
        </div>
      </Section>

      <Section variant="alternate" className="py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8 text-center">Required Documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center"><CheckCircle className="w-5 h-5 text-success mr-2" /> For Pre-Primary</h4>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside pl-2">
                <li>Birth Certificate</li>
                <li>Passport size photographs (4)</li>
                <li>Vaccination/Immunization Record</li>
                <li>Aadhar Card of Parents</li>
              </ul>
            </Card>
            <Card className="p-6">
              <h4 className="font-bold text-slate-900 mb-4 flex items-center"><CheckCircle className="w-5 h-5 text-success mr-2" /> For Class I and Above</h4>
              <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside pl-2">
                <li>Original Transfer Certificate (TC)</li>
                <li>Previous Year Report Card</li>
                <li>Birth Certificate</li>
                <li>Passport size photographs (4)</li>
                <li>Aadhar Card of Parents and Child</li>
              </ul>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
};
