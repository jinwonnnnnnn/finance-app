import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: tokens } = await api.post('/auth/login', form);
      const { data: user } = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      navigate(user.surveyDone ? '/dashboard' : '/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider: 'google' | 'kakao') => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💰 핀테크 입문</h1>
          <p className="text-slate-400">초보자를 위한 재테크 가이드</p>
        </div>

        <div className="bg-[#1a1d27] rounded-2xl p-8 shadow-2xl border border-slate-800">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 font-semibold transition"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#1a1d27] px-3 text-slate-500 text-sm">또는</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl py-3 font-semibold transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
            <button
              onClick={() => handleOAuth('kakao')}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#fdd800] text-[#191919] rounded-xl py-3 font-semibold transition"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.756 1.74 5.17 4.355 6.584L5.28 21l5.126-2.56C10.784 18.625 11.386 18.672 12 18.672c5.523 0 10-3.477 10-7.872S17.523 3 12 3z"/>
              </svg>
              카카오로 계속하기
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-6">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              회원가입
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
