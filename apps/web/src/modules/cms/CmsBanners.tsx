import { useState, useEffect } from 'react';
import { Plus, Edit2, CheckCircle, Clock, Image as ImageIcon, Trash2 } from 'lucide-react';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../../api/cms';

export const CmsBanners = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    imageUrl: '',
    linkUrl: '',
    order: 0,
    isActive: true,
  });

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const data = await getBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to fetch banners', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        title: record.title,
        imageUrl: record.imageUrl,
        linkUrl: record.linkUrl || '',
        order: record.order || 0,
        isActive: record.isActive !== false,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        imageUrl: '',
        linkUrl: '',
        order: 0,
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateBanner(editingId, formData);
      } else {
        await createBanner(formData);
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    try {
      await deleteBanner(id);
      fetchBanners();
    } catch (err) {
      console.error('Failed to delete banner', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Manage Banners</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Banner
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading banners...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Banner</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Order</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {banners.map((banner) => (
                <tr key={banner.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {banner.imageUrl ? (
                        <div className="w-16 h-10 rounded overflow-hidden shrink-0 bg-slate-100">
                          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-10 rounded bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-medium text-slate-900">{banner.title}</div>
                        {banner.linkUrl && <div className="text-xs text-slate-500">{banner.linkUrl}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {banner.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <Clock className="w-3.5 h-3.5" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {banner.order}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <button 
                        onClick={() => handleOpenModal(banner)}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(banner.id)}
                        className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banners.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No banners found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Banner' : 'Create Banner'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form id="banner-form" onSubmit={handleSave} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Title</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Image URL</label>
                <input 
                  required
                  type="url" 
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                />
                {formData.imageUrl && (
                  <div className="mt-2 rounded-lg overflow-hidden border border-slate-200 w-full h-32 bg-slate-50">
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Link URL (Optional)</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={formData.linkUrl}
                  onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Display Order</label>
                  <input 
                    type="number" 
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                  />
                </div>
                <div className="space-y-2 flex flex-col justify-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-600"
                    />
                    <span className="text-sm font-medium text-slate-700">Active</span>
                  </label>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                form="banner-form"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
              >
                {editingId ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
