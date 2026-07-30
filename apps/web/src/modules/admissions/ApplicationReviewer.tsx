import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import { Check, X, FileText } from 'lucide-react';

export const ApplicationReviewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [reviewComments, setReviewComments] = useState('');
  const [interviewNotes, setInterviewNotes] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appRes, docsRes, revsRes] = await Promise.all([
          apiClient.get(`/v1/admissions/${id}`),
          apiClient.get(`/v1/admission-documents/${id}`),
          apiClient.get(`/v1/admission-review/${id}`)
        ]);
        setApplication(appRes.data.data);
        setDocuments(docsRes.data.data);
        setReviews(revsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const submitReview = async (newStatus: string) => {
    try {
      await apiClient.post('/v1/admission-review', {
        applicationId: id,
        newStatus,
        comments: reviewComments,
        interviewNotes
      });
      navigate('/portal/admissions');
    } catch (err) {
      console.error('Failed to submit review', err);
      alert('Error: ' + (err as any).response?.data?.message || 'Failed to submit review');
    }
  };

  const verifyDocument = async (docId: string, status: string) => {
    try {
      await apiClient.patch(`/v1/admission-documents/${docId}/verify`, { verificationStatus: status });
      setDocuments(documents.map(d => d._id === docId ? { ...d, verificationStatus: status } : d));
    } catch (err) {
      console.error('Failed to verify document', err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading application...</div>;
  if (!application) return <div className="p-8 text-center text-red-600">Application not found</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Application: {application.applicationNumber}</h1>
        <span className="px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800">
          Status: {application.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applicant Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">Applicant Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Name</span>
                <span className="font-medium">{application.studentInfo.firstName} {application.studentInfo.lastName}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Date of Birth</span>
                <span className="font-medium">{new Date(application.studentInfo.dob).toLocaleDateString()}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Gender</span>
                <span className="font-medium">{application.studentInfo.gender}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Applied Class</span>
                <span className="font-medium">{application.appliedClassId?.name}</span>
              </div>
            </div>
            
            <h3 className="text-md font-bold mt-6 mb-2">Guardian Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 block">Name</span>
                <span className="font-medium">{application.guardianInfo.name}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Relationship</span>
                <span className="font-medium">{application.guardianInfo.relationship}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Phone</span>
                <span className="font-medium">{application.guardianInfo.phone}</span>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold border-b pb-2 mb-4 flex justify-between items-center">
              <span>Uploaded Documents</span>
              <span className="text-sm font-normal bg-gray-100 px-2 py-1 rounded text-gray-600">{documents.length} Files</span>
            </h2>
            <div className="space-y-4">
              {documents.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No documents uploaded yet.</div>
              ) : (
                documents.map(doc => (
                  <div key={doc._id} className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="w-8 h-8 text-indigo-500 mr-3" />
                      <div>
                        <p className="font-medium text-gray-900">{doc.documentType}</p>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">View File</a>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        doc.verificationStatus === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                        doc.verificationStatus === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>{doc.verificationStatus}</span>
                      
                      {doc.verificationStatus === 'PENDING' && (
                        <>
                          <button onClick={() => verifyDocument(doc._id, 'VERIFIED')} className="p-1 text-green-600 hover:bg-green-100 rounded">
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={() => verifyDocument(doc._id, 'REJECTED')} className="p-1 text-red-600 hover:bg-red-100 rounded">
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Action Panel */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">Review Action</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Internal Comments</label>
                <textarea 
                  rows={3} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={reviewComments}
                  onChange={e => setReviewComments(e.target.value)}
                  placeholder="Notes on document verification, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Interview Notes</label>
                <textarea 
                  rows={2} 
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                  value={interviewNotes}
                  onChange={e => setInterviewNotes(e.target.value)}
                  placeholder="Notes from principal/officer interview"
                />
              </div>
              
              <div className="pt-4 grid grid-cols-2 gap-2">
                <button 
                  onClick={() => submitReview('APPROVED')}
                  className="bg-green-600 text-white py-2 rounded-lg font-bold hover:bg-green-700 col-span-2 text-center"
                >
                  Approve & Enroll
                </button>
                <button 
                  onClick={() => submitReview('WAITLISTED')}
                  className="bg-yellow-500 text-white py-2 rounded-lg font-bold hover:bg-yellow-600"
                >
                  Waitlist
                </button>
                <button 
                  onClick={() => submitReview('REJECTED')}
                  className="bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold border-b pb-2 mb-4">Review History</h2>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <div className="text-gray-500 text-sm">No review history.</div>
              ) : (
                reviews.map(rev => (
                  <div key={rev._id} className="text-sm border-l-2 border-indigo-200 pl-3">
                    <p className="font-medium text-gray-900">{rev.reviewerId?.identifier}</p>
                    <p className="text-xs text-gray-500">{new Date(rev.createdAt).toLocaleString()}</p>
                    <p className="mt-1 text-gray-700">Status changed from <strong>{rev.oldStatus}</strong> to <strong>{rev.newStatus}</strong></p>
                    {rev.comments && <p className="mt-1 text-gray-600 italic">"{rev.comments}"</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
