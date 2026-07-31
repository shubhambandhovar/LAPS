import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { getPublicTheme, getPublicMenus } from '../api/public';
import { HelmetProvider } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ChevronRight, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '../components/public/ui';

export const PublicLayout: React.FC = () => {
  const [theme, setTheme] = useState<any>(null);
  const [menus, setMenus] = useState<any[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    Promise.all([getPublicTheme(), getPublicMenus()]).then(([themeData, menusData]) => {
      if (themeData) setTheme(themeData);
      if (menusData) setMenus(menusData);
    }).catch(err => console.error("Failed to load public layout data", err));
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const headerMenu = menus.find(m => m.location === 'HEADER');

  const navLinks = headerMenu?.items || [
    { url: '/', label: 'Home' },
    { url: '/about', label: 'About Us' },
    { url: '/academics', label: 'Academics' },
    { url: '/facilities', label: 'Facilities' },
    { url: '/admissions', label: 'Admissions' },
    { url: '/gallery', label: 'Gallery' },
    { url: '/contact', label: 'Contact' }
  ];

  const isHome = location.pathname === '/';
  const navBg = scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm' : (isHome ? 'bg-transparent' : 'bg-white shadow-sm');
  const textColor = (isHome && !scrolled) ? 'text-white' : 'text-slate-800';

  return (
    <HelmetProvider>
      <div className="min-h-screen flex flex-col font-sans bg-surface-bg text-slate-800">
        
        {/* Top Bar */}
        <div className="bg-primary-700 text-white py-2 px-4 sm:px-6 lg:px-8 text-sm hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <span className="flex items-center"><Phone className="w-4 h-4 mr-2"/> +91 98765 43210</span>
              <span className="flex items-center"><Mail className="w-4 h-4 mr-2"/> info@laps.edu.in</span>
            </div>
            <div className="flex space-x-4">
              <Link to="/news" className="hover:text-secondary-500 transition-colors">News</Link>
              <Link to="/calendar" className="hover:text-secondary-500 transition-colors">Calendar</Link>
              <Link to="/portal" className="hover:text-secondary-500 font-semibold transition-colors">ERP Login</Link>
            </div>
          </div>
        </div>

        {/* Main Navbar */}
        <header className={`sticky top-0 z-50 transition-all duration-300 ${navBg}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-3 z-50">
              {theme?.logoUrl ? (
                <img src={theme.logoUrl} alt="Logo" className="h-12 object-contain" />
              ) : (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl ${isHome && !scrolled ? 'bg-white/20 text-white' : 'bg-primary-500 text-white'}`}>
                  LA
                </div>
              )}
              <div className="flex flex-col">
                <span className={`font-heading font-bold text-xl leading-tight ${textColor}`}>Little Angels</span>
                <span className={`text-xs ${isHome && !scrolled ? 'text-white/80' : 'text-slate-500'}`}>School, Gohad</span>
              </div>
            </Link>

            <nav className="hidden lg:flex items-center space-x-1">
              {navLinks.map((item: any) => (
                <Link
                  key={item.url}
                  to={item.url}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    location.pathname === item.url 
                      ? (isHome && !scrolled ? 'bg-white/20 text-white' : 'bg-primary-50 text-primary-700')
                      : `${textColor} hover:bg-primary-50/20 hover:text-primary-500`
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="hidden lg:flex items-center space-x-4">
              <Link to="/login">
                <Button variant={isHome && !scrolled ? 'ghost' : 'outline'} className={isHome && !scrolled ? 'text-white hover:bg-white/10' : ''}>
                  Portal Login
                </Button>
              </Link>
              <Link to="/apply">
                <Button variant="accent">Apply Now</Button>
              </Link>
            </div>

            <button
              className={`lg:hidden p-2 rounded-md ${textColor}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {/* Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 py-6 space-y-1">
                {navLinks.map((item: any) => (
                  <Link
                    key={item.url}
                    to={item.url}
                    className="block px-3 py-3 rounded-md text-base font-medium text-slate-800 hover:bg-slate-50 hover:text-primary-600"
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-4 flex flex-col space-y-3">
                  <Link to="/login">
                    <Button variant="outline" className="w-full justify-center">Portal Login</Button>
                  </Link>
                  <Link to="/apply">
                    <Button variant="primary" className="w-full justify-center">Apply Now</Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-grow flex flex-col relative z-10">
          <Outlet />
        </main>

        <footer className="bg-primary-700 text-slate-300 pt-16 pb-8 border-t-[12px] border-secondary-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 lg:col-span-1">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-primary-700 font-bold text-2xl shadow-lg">
                    LA
                  </div>
                  <span className="text-2xl font-heading font-bold text-white leading-none">LAPS</span>
                </div>
                <p className="text-sm leading-relaxed text-slate-300 mb-6">
                  Empowering students to achieve academic excellence and personal growth in a nurturing environment since 1995.
                </p>
                <div className="flex space-x-4">
                  {/* Social Icons Placeholders */}
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center hover:bg-secondary-500 transition-colors cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center hover:bg-secondary-500 transition-colors cursor-pointer" />
                  <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center hover:bg-secondary-500 transition-colors cursor-pointer" />
                </div>
              </div>
              
              <div>
                <h3 className="text-white font-semibold mb-6 text-lg">Quick Links</h3>
                <ul className="space-y-3">
                  {navLinks.slice(0, 5).map((item: any) => (
                    <li key={item.url}>
                      <Link to={item.url} className="text-sm flex items-center hover:text-secondary-400 transition-colors group">
                        <ChevronRight className="w-4 h-4 mr-2 text-primary-500 group-hover:text-secondary-400 transition-colors" />
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-6 text-lg">Academics</h3>
                <ul className="space-y-3">
                  <li><Link to="/academics" className="text-sm flex items-center hover:text-secondary-400 transition-colors group"><ChevronRight className="w-4 h-4 mr-2 text-primary-500 group-hover:text-secondary-400" />Pre-Primary</Link></li>
                  <li><Link to="/academics" className="text-sm flex items-center hover:text-secondary-400 transition-colors group"><ChevronRight className="w-4 h-4 mr-2 text-primary-500 group-hover:text-secondary-400" />Primary</Link></li>
                  <li><Link to="/academics" className="text-sm flex items-center hover:text-secondary-400 transition-colors group"><ChevronRight className="w-4 h-4 mr-2 text-primary-500 group-hover:text-secondary-400" />Middle School</Link></li>
                  <li><Link to="/academics" className="text-sm flex items-center hover:text-secondary-400 transition-colors group"><ChevronRight className="w-4 h-4 mr-2 text-primary-500 group-hover:text-secondary-400" />Senior Secondary</Link></li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-semibold mb-6 text-lg">Contact Us</h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <MapPin className="w-5 h-5 mr-3 text-secondary-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-slate-300">123 Education Lane, Civil Lines, Gohad, Madhya Pradesh 477116</span>
                  </li>
                  <li className="flex items-center">
                    <Phone className="w-5 h-5 mr-3 text-secondary-500 flex-shrink-0" />
                    <span className="text-sm text-slate-300">+91 98765 43210</span>
                  </li>
                  <li className="flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-secondary-500 flex-shrink-0" />
                    <span className="text-sm text-slate-300">admissions@laps.edu.in</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="pt-8 border-t border-primary-600 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400">
              <p>© {new Date().getFullYear()} Little Angels School, Gohad. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex space-x-6">
                <Link to="/page/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/page/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                <span>Powered by LAPS</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </HelmetProvider>
  );
};
