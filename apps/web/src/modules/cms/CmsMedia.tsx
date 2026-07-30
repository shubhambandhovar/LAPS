import { useState, useEffect } from 'react';
import { Upload, Trash2, Image as ImageIcon, FileText } from 'lucide-react';
import { getMedia, uploadMedia, deleteMedia } from '../../api/cms';

export const CmsMedia = () => {
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    url: '',
    type: 'IMAGE',
  });

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const data = await getMedia();
      setMedia(data);
    } catch (err) {
      console.error('Failed to fetch media', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.url) return;
    setUploading(true);
    try {
      await uploadMedia({
        title: uploadData.title || uploadData.url.split('/').pop(),
        url: uploadData.url,
        type: uploadData.type,
      });
      setUploadData({ title: '', url: '', type: 'IMAGE' });
      fetchMedia();
    } catch (err) {
      console.error('Upload failed', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this media asset?')) return;
    try {
      await deleteMedia(id);
      fetchMedia();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Media Library</h2>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Upload New Media</h3>
        <form onSubmit={handleUpload} className="flex gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-medium text-slate-700">URL</label>
            <input 
              required
              type="url"
              placeholder="https://..."
              value={uploadData.url}
              onChange={(e) => setUploadData({...uploadData, url: e.target.value})}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-medium text-slate-700">Title (Optional)</label>
            <input 
              type="text"
              value={uploadData.title}
              onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
            />
          </div>
          <div className="w-40 space-y-1">
            <label className="block text-xs font-medium text-slate-700">Type</label>
            <select
              value={uploadData.type}
              onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm bg-white"
            >
              <option value="IMAGE">Image</option>
              <option value="DOCUMENT">Document</option>
              <option value="VIDEO">Video</option>
            </select>
          </div>
          <button 
            type="submit"
            disabled={uploading}
            className="h-10 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-slate-500">Loading media library...</div>
        ) : media.map((item) => (
          <div key={item.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm group">
            <div className="aspect-square bg-slate-100 flex items-center justify-center relative">
              {item.type === 'IMAGE' ? (
                <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-12 h-12 text-slate-400" />
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button 
                  onClick={() => window.open(item.url, '_blank')}
                  className="p-2 bg-white text-slate-900 rounded-full hover:bg-indigo-50 transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold text-slate-900 truncate" title={item.title}>{item.title}</div>
              <div className="text-[10px] text-slate-500 mt-0.5 flex justify-between">
                <span>{item.type}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
        {!loading && media.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl border-dashed">
            No media assets found. Upload one to get started.
          </div>
        )}
      </div>
    </div>
  );
};
