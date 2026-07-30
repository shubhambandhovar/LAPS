import React, { useState, useEffect } from 'react';

interface MyReportCardRow {
  _id: string;
  reportCardNumber: string;
  examId: { name: string; examType: string };
  classId: { name: string };
  sectionId: { name: string };
  versionNumber: number;
  status: 'PUBLISHED';
  meritRanking?: {
    overallPercentage: number;
    gpa: number;
    rankInClass?: number;
  };
  attendanceSummary?: {
    workingDays: number;
    presentDays: number;
    attendancePercentage: number;
  };
  pdfUrl?: string;
  createdAt: string;
}

export const MyReportCardsPage: React.FC = () => {
  const [myCards, setMyCards] = useState<MyReportCardRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMyCards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/v1/report-cards/my', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMyCards(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch your report cards');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCards();
  }, []);

  const handleDownload = async (id: string, version: number) => {
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/v1/report-cards/${id}/download?version=${version}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success && data.data?.pdfUrl) {
        // Open printable link or alert in demo
        window.open(data.data.pdfUrl, '_blank');
      } else {
        alert(data.message || 'Unable to download PDF');
      }
    } catch (err: any) {
      alert('Network error while downloading PDF');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Report Cards & Transcripts</h1>
        <p className="text-sm text-gray-600">
          View official published report cards, attendance summaries, and download printable PDFs
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-lg border">
            Loading your report cards...
          </div>
        ) : myCards.length === 0 ? (
          <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-lg border">
            No published report cards available for your enrollment yet.
          </div>
        ) : (
          myCards.map((rc) => (
            <div
              key={rc._id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{rc.examId?.name}</h3>
                    <div className="text-xs text-gray-500">
                      {rc.classId?.name} — {rc.sectionId?.name}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    Published
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                  <div>
                    <span className="text-gray-500 block">Report Card #</span>
                    <span className="font-semibold text-gray-800">{rc.reportCardNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Version</span>
                    <span className="font-semibold text-gray-800">v{rc.versionNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Rank / Percentage</span>
                    <span className="font-semibold text-gray-800">
                      #{rc.meritRanking?.rankInClass || '-'} ({rc.meritRanking?.overallPercentage || 0}%)
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Attendance</span>
                    <span className="font-semibold text-gray-800">
                      {rc.attendanceSummary?.attendancePercentage || 0}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => handleDownload(rc._id, rc.versionNumber)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs font-medium transition"
                >
                  Download PDF
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
