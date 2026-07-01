import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  nickname: string;
  surveyDone: boolean;   // 온보딩 설문 완료 여부 (false면 로그인 후 /onboarding으로 이동)
  interests: string[];   // 관심 분야: ['STOCK_KR', 'STOCK_US', 'COIN', 'PENSION']
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

/**
 * 인증 상태 전역 스토어 (Zustand + persist)
 *
 * persist 미들웨어로 localStorage에 자동 저장 → 새로고침해도 로그인 유지
 * localStorage에는 토큰도 별도로 저장 → api.ts 인터셉터에서 직접 읽음
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      // 로그인/OAuth 성공 시 호출: 유저 정보 + 토큰 저장
      setAuth: (user, accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        set({ user, accessToken, refreshToken });
      },

      // 프로필 업데이트 (설문 완료 후 surveyDone: true 반영 등)
      setUser: (user) => set({ user }),

      // 로그아웃: 인증 데이터만 삭제 (투어 완료 여부 등 앱 설정은 유지)
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('auth-storage');
        set({ user: null, accessToken: null, refreshToken: null });
      },
    }),
    {
      name: 'auth-storage',
      // 민감하지 않은 유저 정보와 토큰만 localStorage에 유지
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);
