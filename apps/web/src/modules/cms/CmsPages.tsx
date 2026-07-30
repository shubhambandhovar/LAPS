import { useState, useEffect } from 'react';
import { Plus, Edit2, Globe, FileText, CheckCircle, Clock } from 'lucide-react';
import { getPages, createPage, updatePage, publishPage } from '../../api/cms';

export const CmsPages = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'DRAFT',
    seoTitle: '',
    seoDescription: '',
  });

  const fetchPages = async () => {
    setLoading(true);
    try {
      const data = await getPages();
      setPages(data);
    } catch (err: any) {
      console.error('Failed to fetch pages', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        title: record.title,
        slug: record.slug,
        content: record.content || '',
        status: record.status,
        seoTitle: record.seoMetadata?.title || '',
        seoDescription: record.seoMetadata?.description || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        status: 'DRAFT',
        seoTitle: '',
        seoDescription: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title: formData.title,
      slug: formData.slug,
      content: formData.content,
      status: formData.status,
      seoMetadata: {
        title: formData.seoTitle,
        description: formData.seoDescription
      }
    };

    try {
      if (editingId) {
        await updatePage(editingId, payload);
      } else {
        await createPage(payload);
      }
      setIsModalOpen(false);
      fetchPages();
    } catch (err: any) {
      console.error('Action failed', err);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await publishPage(id);
      fetchPages();
    } catch (err: any) {
      console.error('Failed to publish page', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Manage Pages</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Page
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading pages...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Page</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">{page.title}</div>
                        <div className="text-xs text-slate-500">/{page.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {page.status === 'PUBLISHED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        Draft
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {page.status !== 'PUBLISHED' && (
                        <button 
                          onClick={() => handlePublish(page.id)}
                          className="flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          Publish
                        </button>
                      )}
                      <button 
                        onClick={() => handleOpenModal(page)}
                        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No pages found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                {editingId ? 'Edit Page' : 'Create Page'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="page-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
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
                    <label className="block text-sm font-medium text-slate-700">Slug</label>
                    <input 
                      required
                      type="text" 
                      value={formData.slug}
                      onChange={(e) => setFormData({...formData, slug: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Content (Markdown)</label>
                  <textarea 
                    required
                    rows={8}
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm bg-white"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>

                <div className="border-t border-slate-200 pt-6 space-y-6">
                  <h4 className="text-sm font-semibold text-slate-900">SEO Metadata</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">SEO Title</label>
                      <input 
                        type="text" 
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({...formData, seoTitle: e.target.value})}
                        className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">SEO Description</label>
                      <textarea 
                        rows={2}
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({...formData, seoDescription: e.target.value})}
                        className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm resize-y"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

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
                form="page-form"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
              >
                {editingId ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
