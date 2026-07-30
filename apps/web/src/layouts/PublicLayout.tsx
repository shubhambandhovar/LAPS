import React, { useEffect, useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { getPublicTheme, getPublicMenus } from '../api/public';

export const PublicLayout: React.FC = () => {
  const [theme, setTheme] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getPublicTheme(), getPublicMenus()]).then(([themeData, menusData]) => {
      if (themeData) setTheme(themeData);
      if (menusData) setMenus(menusData);
      
      if (themeData?.customCss) {
        let styleEl = document.getElementById('cms-custom-css');
        if (!styleEl) {
          styleEl = document.createElement('style');
          styleEl.id = 'cms-custom-css';
          document.head.appendChild(styleEl);
        }
        styleEl.textContent = themeData.customCss;
      }
      
      if (themeData?.primaryColor) {
        document.documentElement.style.setProperty('--color-primary', themeData.primaryColor);
      }
      if (themeData?.secondaryColor) {
        document.documentElement.style.setProperty('--color-secondary', themeData.secondaryColor);
      }
      if (themeData?.fontFamily) {
        document.documentElement.style.setProperty('--font-family', themeData.fontFamily);
      }
      if (themeData?.faviconUrl) {
        let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = themeData.faviconUrl;
      }
    }).catch(err => {
      console.error("Failed to load public layout data", err);
    });
  }, []);

  const headerMenu = menus.find(m => m.location === 'HEADER');
  const footer1Menu = menus.find(m => m.location === 'FOOTER_1');
  const footer2Menu = menus.find(m => m.location === 'FOOTER_2');

  return (
    <div className="min-h-screen flex flex-col bg-slate-50" style={{ fontFamily: 'var(--font-family, Inter, sans-serif)' }}>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-4">
            {theme?.logoUrl ? (
              <img src={theme.logoUrl} alt="School Logo" className="h-12 object-contain" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: 'var(--color-primary, #4f46e5)' }}>
                LA
              </div>
            )}
            <div>
              <span className="block font-bold text-slate-900 text-xl leading-tight" style={{ color: 'var(--color-secondary, #1e293b)' }}>
                Little Angels School
              </span>
              <span className="block text-sm text-slate-500">Gohad, Madhya Pradesh</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            {headerMenu?.items?.map((item: any) => (
              <Link
                key={item.url}
                to={item.url}
                className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                style={{ ':hover': { color: 'var(--color-primary, #4f46e5)' } } as any}
              >
                {item.label}
              </Link>
            ))}
            {!headerMenu && (
              <>
                <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Home</Link>
                <Link to="/about" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">About Us</Link>
                <Link to="/academics" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Academics</Link>
                <Link to="/admissions" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors">Admissions</Link>
              </>
            )}
            <Link
              to="/login"
              className="inline-flex items-center px-5 py-2.5 rounded-lg text-white text-sm font-semibold transition-colors shadow-sm"
              style={{ backgroundColor: 'var(--color-primary, #4f46e5)' }}
            >
              Portal Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8" style={{ backgroundColor: 'var(--color-secondary, #1e293b)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {theme?.logoUrl ? (
                  <img src={theme.logoUrl} alt="School Logo" className="h-10 object-contain brightness-0 invert" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: 'var(--color-primary, #4f46e5)' }}>
                    LA
                  </div>
                )}
                <span className="text-xl font-bold text-white">Little Angels School</span>
              </div>
              <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
                Empowering students to achieve academic excellence and personal growth in a nurturing environment since 1995.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-6">{footer1Menu?.name || 'Quick Links'}</h3>
              <ul className="space-y-3">
                {footer1Menu?.items?.map((item: any) => (
                  <li key={item.url}>
                    <Link to={item.url} className="text-sm hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
                {!footer1Menu && (
                  <>
                    <li><Link to="/about" className="text-sm hover:text-white transition-colors">About Us</Link></li>
                    <li><Link to="/admissions" className="text-sm hover:text-white transition-colors">Admissions</Link></li>
                    <li><Link to="/contact" className="text-sm hover:text-white transition-colors">Contact</Link></li>
                  </>
                )}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-6">{footer2Menu?.name || 'Resources'}</h3>
              <ul className="space-y-3">
                {footer2Menu?.items?.map((item: any) => (
                  <li key={item.url}>
                    <Link to={item.url} className="text-sm hover:text-white transition-colors">{item.label}</Link>
                  </li>
                ))}
                {!footer2Menu && (
                  <>
                    <li><Link to="/gallery" className="text-sm hover:text-white transition-colors">Gallery</Link></li>
                    <li><Link to="/news" className="text-sm hover:text-white transition-colors">News & Events</Link></li>
                    <li><Link to="/notices" className="text-sm hover:text-white transition-colors">Notices</Link></li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
            <p>© {new Date().getFullYear()} Little Angels School, Gohad. All rights reserved.</p>
            <p className="mt-2 md:mt-0">Powered by LAPS Education Platform</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
