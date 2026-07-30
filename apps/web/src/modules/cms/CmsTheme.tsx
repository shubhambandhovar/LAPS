import { useState, useEffect } from 'react';
import { Save, Palette } from 'lucide-react';
import { getThemeSettings, updateThemeSettings } from '../../api/cms';

export const CmsTheme = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    primaryColor: '#4f46e5',
    secondaryColor: '#1e293b',
    fontFamily: 'Inter',
    logoUrl: '',
    faviconUrl: '',
    customCss: '',
  });

  const fetchTheme = async () => {
    setLoading(true);
    try {
      const data = await getThemeSettings();
      if (data) {
        setFormData({
          primaryColor: data.primaryColor || '#4f46e5',
          secondaryColor: data.secondaryColor || '#1e293b',
          fontFamily: data.fontFamily || 'Inter',
          logoUrl: data.logoUrl || '',
          faviconUrl: data.faviconUrl || '',
          customCss: data.customCss || '',
        });
      }
    } catch (err) {
      console.error('Failed to fetch theme settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateThemeSettings(formData);
      alert('Theme settings updated successfully');
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to update theme settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading theme settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Palette className="w-5 h-5 text-indigo-600" />
          Theme & Branding
        </h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 max-w-4xl">
        <form id="theme-form" onSubmit={handleSave} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Colors & Typography</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-300"
                    />
                    <input 
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({...formData, primaryColor: e.target.value})}
                      className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">Secondary Color</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                      className="w-10 h-10 rounded cursor-pointer border border-slate-300"
                    />
                    <input 
                      type="text"
                      value={formData.secondaryColor}
                      onChange={(e) => setFormData({...formData, secondaryColor: e.target.value})}
                      className="flex-1 h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Primary Font Family</label>
                <select
                  value={formData.fontFamily}
                  onChange={(e) => setFormData({...formData, fontFamily: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
                >
                  <option value="Inter">Inter (Default)</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="system-ui">System Default</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">Assets</h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Logo URL</label>
                <input 
                  type="url"
                  placeholder="https://..."
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                />
                {formData.logoUrl && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                    <img src={formData.logoUrl} alt="Logo Preview" className="h-12 object-contain" />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Favicon URL</label>
                <input 
                  type="url"
                  placeholder="https://..."
                  value={formData.faviconUrl}
                  onChange={(e) => setFormData({...formData, faviconUrl: e.target.value})}
                  className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
                />
                {formData.faviconUrl && (
                  <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-lg inline-block">
                    <img src={formData.faviconUrl} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-6 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-700 flex justify-between">
              Custom CSS (Advanced)
              <span className="text-xs text-slate-500 font-normal">Injected into public website head</span>
            </label>
            <textarea 
              rows={6}
              value={formData.customCss}
              onChange={(e) => setFormData({...formData, customCss: e.target.value})}
              className="w-full p-3 rounded-lg border border-slate-300 text-sm font-mono bg-slate-900 text-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow resize-y"
              placeholder="/* Add custom global CSS styles here */"
            />
          </div>
        </form>
      </div>
    </div>
  );
};
