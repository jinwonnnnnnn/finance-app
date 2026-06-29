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
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">💰 핀테크 입문</h1>
          <p className="text-slate-400">재테크 첫 걸음을 시작해보세요</p>
        </div>

        <div className="bg-[#1a1d27] rounded-2xl p-8 shadow-2xl border border-slate-800">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">닉네임</label>
              <input
                value={form.nickname}
                onChange={(e) => setForm({ ...form, nickname: e.target.value })}
                className="w-full bg-[#0f1117] border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                placeholder="사용할 닉네임"
                required
              />
            </div>
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
                placeholder="6자 이상"
                minLength={6}
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl py-3 font-semibold transition"
            >
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="text-center text-slate-500 text-sm mt-6">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold">
              로그인
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
