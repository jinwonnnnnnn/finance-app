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
    // OAuth 리다이렉트는 Vercel 프록시를 거치면 302 체인이 깨지므로 Railway 직접 호출
    const backendUrl = 'https://precious-gentleness-production.up.railway.app';
    window.location.href = `${backendUrl}/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-[#08090d] flex">
      {/* 왼쪽 브랜드 패널 (데스크톱) */}
      <div className="hidden lg:flex flex-col justify-between w-[440px] shrink-0 p-12 relative overflow-hidden border-r border-white/[0.04]">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-indigo-950/40 via-[#08090d] to-violet-950/20" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-violet-600/15 rounded-full blur-[60px] pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <span className="text-white font-bold text-sm">핀</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">핀테크입문</span>
          </div>

          <h1 className="text-[2.5rem] font-bold text-white leading-tight mb-5">
            투자,<br />
            이제 쉽게<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              시작해보세요
            </span>
          </h1>
          <p className="text-slate-400 text-[15px] leading-relaxed">
            초보자를 위한 실시간 시세 확인,<br />
            AI 맞춤 투자 가이드, 금융 용어 해설.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: '📊', label: '실시간 주식·코인 시세', sub: '미국·국내 주식 실시간 차트' },
            { icon: '🤖', label: 'AI 맞춤 투자 제안', sub: '뉴스 기반 개인화 분석' },
            { icon: '📖', label: '금융 용어 사전', sub: '금융감독원 기준 해설' },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                <span className="text-xl">{f.icon}</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{f.label}</p>
                <p className="text-slate-500 text-xs">{f.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 오른쪽 로그인 폼 */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-[360px]"
        >
          {/* 모바일 로고 */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 justify-center">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">핀</span>
            </div>
            <span className="text-white font-semibold text-lg">핀테크입문</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">로그인</h2>
            <p className="text-slate-500 text-sm">계정으로 계속 진행하세요</p>
          </div>

          {/* 소셜 로그인 */}
          <div className="space-y-2.5 mb-6">
            <button
              onClick={() => handleOAuth('google')}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 active:scale-[0.98] text-gray-800 rounded-2xl py-3.5 font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google로 계속하기
            </button>
            <button
              onClick={() => handleOAuth('kakao')}
              className="w-full flex items-center justify-center gap-3 bg-[#FEE500] hover:bg-[#fdd800] active:scale-[0.98] text-[#191919] rounded-2xl py-3.5 font-semibold text-sm transition-all"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.756 1.74 5.17 4.355 6.584L5.28 21l5.126-2.56C10.784 18.625 11.386 18.672 12 18.672c5.523 0 10-3.477 10-7.872S17.523 3 12 3z"/>
              </svg>
              카카오로 계속하기
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.07]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#08090d] px-3 text-slate-600 text-xs">또는 이메일로 로그인</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#111318] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition text-sm"
                placeholder="example@email.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1.5 font-medium">비밀번호</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#111318] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition text-sm"
                placeholder="비밀번호 입력"
                required
              />
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white rounded-2xl py-3.5 font-semibold text-sm transition-all mt-1 shadow-lg shadow-indigo-600/20"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-slate-600 text-xs mt-6">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
              회원가입
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
