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

// 응답 인터셉터: 401(인증 만료) 시 리프레시 토큰으로 자동 갱신
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // 리프레시 토큰으로 새 액세스 토큰 발급
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          // 실패했던 원래 요청을 새 토큰으로 재시도
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(error.config);
        } catch {
          // 리프레시도 실패하면 로그아웃 처리
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
