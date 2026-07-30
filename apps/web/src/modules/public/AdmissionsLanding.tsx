import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, FileText, Upload } from 'lucide-react';
import { apiClient } from '../../lib/api';

export const AdmissionsLanding: React.FC = () => {
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/v1/admission-cycles/active')
      .then((res: any) => {
        setActiveCycle(res.data.data);
      })
      .catch(() => {
        setActiveCycle(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Admissions at Little Angels School
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Join a community dedicated to academic excellence, holistic development, and character building.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>
        ) : activeCycle ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-16 border border-gray-100">
            <div className="bg-indigo-600 px-8 py-10 text-white text-center">
              <h2 className="text-3xl font-bold">Applications are Open!</h2>
              <p className="mt-2 text-indigo-100 text-lg">
                For the {activeCycle.cycle.academicSessionId.name} Academic Session
              </p>
              <div className="mt-8 flex justify-center space-x-4">
                <Link
                  to="/apply"
                  className="bg-white text-indigo-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Apply Now
                </Link>
                <Link
                  to="/application-status"
                  className="bg-indigo-500 border border-indigo-400 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-indigo-400 transition-colors shadow-lg"
                >
                  Check Status
                </Link>
              </div>
            </div>
            
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Seat Availability</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {activeCycle.seatAllocations.map((seat: any) => (
                  <div key={seat._id} className="bg-gray-50 p-6 rounded-xl text-center border border-gray-100">
                    <div className="text-xl font-bold text-gray-900">{seat.classId.name}</div>
                    <div className="mt-2 flex flex-col">
                      <span className="text-3xl font-extrabold text-indigo-600">{seat.availableSeats}</span>
                      <span className="text-sm text-gray-500 font-medium">Seats Available</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg mb-16 max-w-4xl mx-auto">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-yellow-800">Applications are currently closed</h3>
                <p className="mt-2 text-yellow-700">
                  We are not accepting new applications at this time. Please check back later or contact the admission office for information about the next admission cycle.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Process Steps */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Admission Process</h2>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative z-10">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <FileText className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">1. Submit Application</h3>
              <p className="text-gray-600">Fill out the online application form with student and guardian details.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative z-10">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">2. Upload Documents</h3>
              <p className="text-gray-600">Upload required documents like Birth Certificate, previous school records, and photographs.</p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative z-10">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">3. Review & Admission</h3>
              <p className="text-gray-600">Our admission office will review your application and confirm your admission status.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
