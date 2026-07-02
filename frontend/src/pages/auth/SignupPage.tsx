import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function SignupPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '', nickname: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data: tokens } = await api.post('/auth/signup', form);
      const { data: user } = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });
      setAuth(user, tokens.accessToken, tokens.refreshToken);
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message ?? '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#08090d] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[360px]"
      >
        <Link to="/login" className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">핀</span>
          </div>
          <span className="text-white font-semibold text-lg">핀테크입문</span>
        </Link>

        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-1">회원가입</h2>
          <p className="text-slate-500 text-sm">재테크 첫 걸음을 시작해보세요</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1.5 font-medium">닉네임</label>
            <input
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              className="w-full bg-[#111318] border border-white/[0.07] rounded-2xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition text-sm"
              placeholder="사용할 닉네임"
              required
            />
          </div>
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
              placeholder="6자 이상"
              minLength={6}
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
            {loading ? '가입 중...' : '회원가입 시작하기'}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
            로그인
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
