import { useState } from 'react';
import { CmsPages } from './CmsPages';
import { CmsBanners } from './CmsBanners';
import { CmsMenus } from './CmsMenus';
import { CmsMedia } from './CmsMedia';
import { CmsTheme } from './CmsTheme';
import { LayoutDashboard, FileText, Image, Menu, Palette } from 'lucide-react';

export const CmsDashboard = () => {
  const [activeTab, setActiveTab] = useState('pages');

  const tabs = [
    { id: 'pages', label: 'Pages', icon: FileText },
    { id: 'banners', label: 'Banners', icon: Image },
    { id: 'menus', label: 'Menus', icon: Menu },
    { id: 'media', label: 'Media Assets', icon: LayoutDashboard },
    { id: 'theme', label: 'Theme Settings', icon: Palette },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content Management System</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    whitespace-nowrap flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${isActive 
                      ? 'border-indigo-500 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }
                  `}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-500' : 'text-slate-400'}`} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'pages' && <CmsPages />}
          {activeTab === 'banners' && <CmsBanners />}
          {activeTab === 'menus' && <CmsMenus />}
          {activeTab === 'media' && <CmsMedia />}
          {activeTab === 'theme' && <CmsTheme />}
        </div>
      </div>
    </div>
  );
};
