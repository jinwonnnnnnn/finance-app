import axios from 'axios';

/**
 * 공통 API 클라이언트
 *
 * baseURL '/api'는 Vercel의 vercel.json에서 Railway 백엔드로 프록시됨:
 * /api/* → https://precious-gentleness-production.up.railway.app/api/*
 */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // 쿠키 기반 요청 허용 (OAuth 리다이렉트 등)
});

// 요청 인터셉터: 모든 API 요청에 JWT 액세스 토큰 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 동시에 여러 요청이 401을 받아도 refresh 는 한 번만 수행하도록 공유(락)
let refreshPromise: Promise<string> | null = null;

function logoutAndRedirect() {
  localStorage.clear();
  if (window.location.pathname !== '/login') window.location.href = '/login';
}

// 응답 인터셉터: 401(인증 만료) 시 리프레시 토큰으로 자동 갱신
// - 요청당 1회만 재시도(_retry 가드)해 401→refresh→재요청 무한 루프 차단
// - refresh 엔드포인트 자체의 401 은 즉시 로그아웃(자기 재귀 방지)
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    // refresh 호출 자체가 401 이면 더 이상 시도하지 않고 로그아웃
    if (typeof original.url === 'string' && original.url.includes('/auth/refresh')) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      logoutAndRedirect();
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      // 동시 401 은 하나의 refresh 요청을 공유
      if (!refreshPromise) {
        refreshPromise = axios
          .post('/api/auth/refresh', { refreshToken })
          .then((r) => {
            localStorage.setItem('accessToken', r.data.accessToken);
            localStorage.setItem('refreshToken', r.data.refreshToken);
            return r.data.accessToken as string;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }
      const newToken = await refreshPromise;
      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch {
      logoutAndRedirect();
      return Promise.reject(error);
    }
  },
);
