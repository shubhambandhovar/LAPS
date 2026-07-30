import { apiClient as api } from '../lib/api';

export const getPublicTheme = () => api.get('/public/theme').then((res: any) => res.data.data);
export const getPublicMenus = () => api.get('/public/menus').then((res: any) => res.data.data);
export const getPublicBanners = () => api.get('/public/banners').then((res: any) => res.data.data);
export const getPublicPage = (slug: string) => api.get(`/public/pages/${slug}`).then((res: any) => res.data.data);
export const getPublicNews = () => api.get('/public/news').then((res: any) => res.data.data);
export const getPublicNotices = () => api.get('/public/notices').then((res: any) => res.data.data);
