import React, { useEffect, useState } from 'react';
import { apiClient } from '../../lib/api';
import {
  FileText,
  Calendar,
  Paperclip,
  Download,
  AlertCircle,
  Search,
  RefreshCw,
} from 'lucide-react';

interface NoticeAttachment {
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
}

interface NoticeRecord {
  _id: string;
  title: string;
  content: string;
  type: 'SCHOOL_NOTICE' | 'CIRCULAR' | 'ANNOUNCEMENT' | 'EVENT';
  status: 'DRAFT' | 'PUBLISHED' | 'EXPIRED' | 'ARCHIVED';
  targetRoles: string[];
  attachments: NoticeAttachment[];
  publishDate?: string;
  expiryDate?: string;
  authorId?: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
    };
    role: string;
  };
  createdAt: string;
}

export const NoticeBoard: React.FC = () => {
  const [notices, setNotices] = useState<NoticeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const fetchNotices = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (selectedType !== 'ALL') queryParams.append('type', selectedType);

      const res = await apiClient.get(`/notices?${queryParams.toString()}`);
      setNotices(res.data.data?.notices || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load school notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedType]);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'CIRCULAR':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Circular</span>;
      case 'ANNOUNCEMENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Announcement</span>;
      case 'EVENT':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Event</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">School Notice</span>;
    }
  };

  const filteredNotices = notices.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">School Notice Board</h1>
            <p className="text-sm text-gray-500">Official institutional circulars, events, and campus announcements</p>
          </div>
        </div>

        <button
          onClick={fetchNotices}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh Notice Board"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-2 flex-1 min-w-[250px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Type:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">All Notice Types</option>
            <option value="SCHOOL_NOTICE">School Notice</option>
            <option value="CIRCULAR">Circular</option>
            <option value="ANNOUNCEMENT">Announcement</option>
            <option value="EVENT">Event</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading notices...</div>
      ) : filteredNotices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No published notices found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotices.map((notice) => (
            <div
              key={notice._id}
              className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getTypeBadge(notice.type)}
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {notice.publishDate
                        ? new Date(notice.publishDate).toLocaleDateString()
                        : new Date(notice.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {notice.authorId && (
                  <span className="text-xs text-gray-500 font-medium">
                    By: {notice.authorId.profile?.firstName} {notice.authorId.profile?.lastName} ({notice.authorId.role})
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-900 mb-2">{notice.title}</h2>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed mb-4">
                {notice.content}
              </p>

              {notice.attachments && notice.attachments.length > 0 && (
                <div className="pt-3 border-t border-gray-100 flex flex-wrap gap-3">
                  {notice.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-purple-700 transition-colors"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                      <span>{att.fileName}</span>
                      <Download className="w-3.5 h-3.5 text-gray-400" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
