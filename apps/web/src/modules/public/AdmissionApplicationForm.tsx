import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { admissionApplicationSchema } from '@laps/shared';
import { apiClient } from '../../lib/api';

export const AdmissionApplicationForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger
  } = useForm({
    resolver: zodResolver(admissionApplicationSchema),
  });

  useEffect(() => {
    apiClient.get('/v1/admission-cycles/active')
      .then((res: any) => {
        setActiveCycle(res.data.data);
      })
      .catch(() => {
        setError('No active admission cycles found.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const nextStep = async (fields: string[]) => {
    const isStepValid = await trigger(fields as any);
    if (isStepValid) setStep(step + 1);
  };

  const onSubmit = async (data: any) => {
    try {
      await apiClient.post('/v1/admissions/submit', data);
      navigate('/application-status', { state: { success: true } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit application');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!activeCycle) return <div className="p-8 text-center text-red-600">{error}</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 px-8 py-6 text-white">
          <h2 className="text-2xl font-bold">Admission Application</h2>
          <p className="mt-1 text-indigo-100">Step {step} of 4</p>
        </div>

        <div className="p-8">
          {error && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
          
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Hidden field for cycle */}
            <input type="hidden" {...register('admissionCycleId')} value={activeCycle.cycle._id} />

            {step === 1 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Class Selection</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Class</label>
                  <select {...register('appliedClassId')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                    <option value="">Select a class...</option>
                    {activeCycle.seatAllocations.map((seat: any) => (
                      <option key={seat.classId._id} value={seat.classId._id} disabled={seat.availableSeats <= 0}>
                        {seat.classId.name} {seat.availableSeats <= 0 ? '(Waitlist)' : ''}
                      </option>
                    ))}
                  </select>
                  {errors.appliedClassId && <p className="text-red-500 text-sm mt-1">{errors.appliedClassId.message as string}</p>}
                </div>

                <div className="flex justify-end">
                  <button type="button" onClick={() => nextStep(['appliedClassId'])} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Student Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium">First Name</label>
                    <input type="text" {...register('studentInfo.firstName')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                    {(errors as any).studentInfo?.firstName && <p className="text-red-500 text-sm mt-1">{(errors as any).studentInfo.firstName.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Last Name</label>
                    <input type="text" {...register('studentInfo.lastName')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Date of Birth</label>
                    <input type="date" {...register('studentInfo.dob')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Gender</label>
                    <select {...register('studentInfo.gender')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium">Address</label>
                    <textarea {...register('studentInfo.address')} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                </div>

                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(step - 1)} className="text-gray-600 px-6 py-2 border rounded-md">Back</button>
                  <button type="button" onClick={() => nextStep(['studentInfo.firstName', 'studentInfo.lastName', 'studentInfo.dob', 'studentInfo.gender', 'studentInfo.address'])} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium">Guardian Name</label>
                    <input type="text" {...register('guardianInfo.name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Relationship</label>
                    <select {...register('guardianInfo.relationship')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border">
                      <option value="FATHER">Father</option>
                      <option value="MOTHER">Mother</option>
                      <option value="LEGAL_GUARDIAN">Legal Guardian</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Phone</label>
                    <input type="text" {...register('guardianInfo.phone')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Email (Optional)</label>
                    <input type="email" {...register('guardianInfo.email')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(step - 1)} className="text-gray-600 px-6 py-2 border rounded-md">Back</button>
                  <button type="button" onClick={() => nextStep(['guardianInfo.name', 'guardianInfo.relationship', 'guardianInfo.phone', 'guardianInfo.email'])} className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700">Next</button>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold border-b pb-2">Review & Submit</h3>
                <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-700">
                  <p className="mb-2">Please verify all information provided is accurate. You will be able to upload documents from your application dashboard after submission.</p>
                </div>
                <div className="flex justify-between">
                  <button type="button" onClick={() => setStep(step - 1)} className="text-gray-600 px-6 py-2 border rounded-md">Back</button>
                  <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 font-bold">Submit Application</button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
