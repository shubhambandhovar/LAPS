import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Section, Input, Textarea, Button, Card } from '../../components/public/ui';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export const ContactPublic: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Contact Us | Little Angels School</title>
        <meta name="description" content="Get in touch with Little Angels School for admissions, queries, and support." />
      </Helmet>
      
      <div className="bg-primary-700 py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-4">Contact Us</h1>
        <p className="text-primary-100 text-lg max-w-2xl mx-auto">We're here to help. Reach out to us for any queries.</p>
      </div>

      <Section className="py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          
          <div>
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8">Send us a Message</h2>
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                  <Input placeholder="John" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                  <Input placeholder="Doe" />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <Input type="email" placeholder="john@example.com" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
                <Input type="tel" placeholder="+91 98765 43210" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <Textarea placeholder="How can we help you?" />
              </div>
              
              <Button type="submit" size="lg" className="w-full sm:w-auto">Send Message</Button>
            </form>
          </div>

          <div>
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-8">Contact Information</h2>
            
            <div className="space-y-6 mb-12">
              <Card className="p-6 flex items-start shadow-sm border-none bg-slate-50">
                <MapPin className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Campus Address</h4>
                  <p className="text-slate-600">123 Education Lane, Civil Lines,<br />Gohad, Madhya Pradesh 477116</p>
                </div>
              </Card>

              <Card className="p-6 flex items-start shadow-sm border-none bg-slate-50">
                <Phone className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Phone Numbers</h4>
                  <p className="text-slate-600">Main Office: +91 98765 43210<br />Admissions: +91 98765 43211</p>
                </div>
              </Card>

              <Card className="p-6 flex items-start shadow-sm border-none bg-slate-50">
                <Mail className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Email Addresses</h4>
                  <p className="text-slate-600">Info: info@laps.edu.in<br />Admissions: admissions@laps.edu.in</p>
                </div>
              </Card>

              <Card className="p-6 flex items-start shadow-sm border-none bg-slate-50">
                <Clock className="w-6 h-6 text-primary-600 mr-4 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Working Hours</h4>
                  <p className="text-slate-600">Monday - Friday: 8:00 AM - 4:00 PM<br />Saturday: 8:00 AM - 1:00 PM</p>
                </div>
              </Card>
            </div>

            {/* Google Maps Placeholder */}
            <div className="w-full h-64 bg-slate-200 rounded-2xl overflow-hidden flex items-center justify-center text-slate-400">
              <MapPin className="w-12 h-12 mb-2" />
              <span>Google Maps Integration</span>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
};
