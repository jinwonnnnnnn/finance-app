import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function OAuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (!accessToken || !refreshToken) {
      navigate('/login');
      return;
    }
    api
      .get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(({ data: user }) => {
        setAuth(user, accessToken, refreshToken);
        navigate(user.surveyDone ? '/dashboard' : '/onboarding');
      })
      .catch(() => navigate('/login'));
  }, []);

  return (
    <div className="min-h-dvh bg-[#0f1117] flex items-center justify-center">
      <div className="text-white text-center">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p>로그인 처리 중...</p>
      </div>
    </div>
  );
}
