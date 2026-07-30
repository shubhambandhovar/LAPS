import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, List } from 'lucide-react';
import { getMenus, createMenu, updateMenu } from '../../api/cms';

export const CmsMenus = () => {
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: 'HEADER',
    items: [] as { label: string; url: string; order: number }[],
  });

  const fetchMenus = async () => {
    setLoading(true);
    try {
      const data = await getMenus();
      setMenus(data);
    } catch (err) {
      console.error('Failed to fetch menus', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const handleOpenModal = (record?: any) => {
    if (record) {
      setEditingId(record.id);
      setFormData({
        name: record.name,
        location: record.location,
        items: record.items || [],
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        location: 'HEADER',
        items: [],
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateMenu(editingId, formData);
      } else {
        await createMenu(formData);
      }
      setIsModalOpen(false);
      fetchMenus();
    } catch (err) {
      console.error('Action failed', err);
    }
  };

  const addMenuItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { label: '', url: '', order: formData.items.length }]
    });
  };

  const updateMenuItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeMenuItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900">Manage Menus</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Menu
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading menus...</div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {menus.map((menu) => (
                <tr key={menu.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <List className="w-4 h-4" />
                      </div>
                      <div className="text-sm font-medium text-slate-900">{menu.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {menu.location}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {menu.items?.length || 0} links
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleOpenModal(menu)}
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                    No menus found. Create one to get started.
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
                {editingId ? 'Edit Menu' : 'Create Menu'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="menu-form" onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Location</label>
                    <select
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      className="w-full h-10 px-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow text-sm bg-white"
                    >
                      <option value="HEADER">Header</option>
                      <option value="FOOTER_1">Footer Column 1</option>
                      <option value="FOOTER_2">Footer Column 2</option>
                      <option value="QUICK_LINKS">Quick Links</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">Menu Links</h4>
                    <button 
                      type="button"
                      onClick={addMenuItem}
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      + Add Link
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formData.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <input 
                          type="text" 
                          placeholder="Label"
                          value={item.label}
                          onChange={(e) => updateMenuItem(index, 'label', e.target.value)}
                          className="flex-1 h-9 px-3 rounded text-sm border border-slate-300"
                        />
                        <input 
                          type="text" 
                          placeholder="URL (/about)"
                          value={item.url}
                          onChange={(e) => updateMenuItem(index, 'url', e.target.value)}
                          className="flex-1 h-9 px-3 rounded text-sm border border-slate-300"
                        />
                        <button
                          type="button"
                          onClick={() => removeMenuItem(index)}
                          className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.items.length === 0 && (
                      <div className="text-sm text-slate-500 text-center py-4">No links added. Add a link to build your menu.</div>
                    )}
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
                form="menu-form"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
              >
                {editingId ? 'Update Menu' : 'Create Menu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
