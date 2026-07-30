import { apiClient as api } from '../lib/api';

// --- PAGES ---

export const getPages = () => api.get('/cms/pages').then((res: any) => res.data.data);

export const getPageById = (id: string) => api.get(`/cms/pages/${id}`).then((res: any) => res.data.data);

export const createPage = (data: any) => api.post('/cms/pages', data).then((res: any) => res.data.data);

export const updatePage = (id: string, data: any) => api.put(`/cms/pages/${id}`, data).then((res: any) => res.data.data);

export const publishPage = (id: string) => api.post(`/cms/pages/${id}/publish`).then((res: any) => res.data.data);

// --- BANNERS ---

export const getBanners = () => api.get('/cms/banners').then((res: any) => res.data.data);

export const createBanner = (data: any) => api.post('/cms/banners', data).then((res: any) => res.data.data);

export const updateBanner = (id: string, data: any) => api.put(`/cms/banners/${id}`, data).then((res: any) => res.data.data);

export const deleteBanner = (id: string) => api.delete(`/cms/banners/${id}`).then((res: any) => res.data.data);

// --- MENUS ---

export const getMenus = () => api.get('/cms/menus').then((res: any) => res.data.data);

export const createMenu = (data: any) => api.post('/cms/menus', data).then((res: any) => res.data.data);

export const updateMenu = (id: string, data: any) => api.put(`/cms/menus/${id}`, data).then((res: any) => res.data.data);

// --- MEDIA ---

export const getMedia = () => api.get('/cms/media').then((res: any) => res.data.data);

export const uploadMedia = (data: any) => api.post('/cms/media', data).then((res: any) => res.data.data);

export const deleteMedia = (id: string) => api.delete(`/cms/media/${id}`).then((res: any) => res.data.data);

// --- THEME ---

export const getThemeSettings = () => api.get('/cms/theme').then((res: any) => res.data.data);

export const updateThemeSettings = (data: any) => api.put('/cms/theme', data).then((res: any) => res.data.data);
