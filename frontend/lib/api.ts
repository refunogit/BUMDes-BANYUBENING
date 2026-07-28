import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - attach JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const pin = localStorage.getItem('pin_code');
    if (pin) {
      config.headers['X-PIN'] = pin;
    }
  }
  return config;
});

// Response interceptor - handle refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry && typeof window !== 'undefined') {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
          const { accessToken, refreshToken: newRefresh } = data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch {
          // Logout
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          if (window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

export const publicApi = {
  getHome: () => api.get('/public/home').then(r => r.data.data),
  getArticles: (params?: any) => api.get('/articles/public', { params }).then(r => r.data),
  getArticleBySlug: (slug: string) => api.get(`/articles/slug/${slug}`).then(r => r.data.data),
  getProducts: (params?: any) => api.get('/products/public', { params }).then(r => r.data),
  getProductBySlug: (slug: string) => api.get(`/products/slug/${slug}`).then(r => r.data.data),
  getPengurus: () => api.get('/pengurus').then(r => r.data.data),
  getRunningText: () => api.get('/running-text').then(r => r.data.data),
  getCarousel: () => api.get('/carousel/active').then(r => r.data.data),
  getIdentity: () => api.get('/identity').then(r => r.data.data),
  getFinancialSummary: () => api.get('/finance/reports/public/summary').then(r => r.data.data),
  search: (q: string) => api.get('/search', { params: { q } }).then(r => r.data.data),
};

export const adminApi = {
  login: (username: string, password: string) => api.post('/auth/login', { username, password }).then(r => r.data.data),
  verifyPin: (pin: string) => api.post('/auth/verify-pin', { pin }).then(r => r.data),
};
