import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../lib/api';
import Navbar from '../../components/layout/Navbar';

const INTERESTS = [
  { label: '🇰🇷 국내주식', value: 'STOCK_KR' },
  { label: '🇺🇸 해외주식', value: 'STOCK_US' },
  { label: '₿ 암호화폐', value: 'COIN' },
  { label: '🏦 퇴직연금/IRP', value: 'PENSION' },
];

const PROVIDER_LABELS: Record<string, string> = {
  local: '이메일',
  google: 'Google',
  kakao: 'Kakao',
};

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111318] border border-white/[0.06] rounded-2xl p-5 mb-4">
      <h2 className="text-[13px] font-semibold text-slate-400 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [nicknameMsg, setNicknameMsg] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(user?.interests ?? []);
  const [interestsMsg, setInterestsMsg] = useState('');

  const nicknameMut = useMutation({
    mutationFn: (val: string) => api.patch('/users/nickname', { nickname: val }).then((r) => r.data),
    onSuccess: (updated) => {
      setUser({ ...user!, ...updated });
      setNicknameMsg('저장됐어요 ✓');
      setTimeout(() => setNicknameMsg(''), 2000);
    },
    onError: () => setNicknameMsg('저장 실패. 다시 시도해주세요.'),
  });

  const interestsMut = useMutation({
    mutationFn: (vals: string[]) => api.patch('/users/interests', { interests: vals }).then((r) => r.data),
    onSuccess: (updated) => {
      setUser({ ...user!, ...updated });
      setInterestsMsg('관심 분야가 업데이트됐어요 ✓');
      setTimeout(() => setInterestsMsg(''), 2000);
    },
    onError: () => setInterestsMsg('저장 실패. 다시 시도해주세요.'),
  });

  const toggleInterest = (val: string) => {
    setSelectedInterests((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val],
    );
  };

  return (
    <div className="min-h-dvh bg-[#08090d]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-16 pb-24 md:pb-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 mb-6"
        >
          <h1 className="text-xl font-bold text-white">설정</h1>
        </motion.div>

        {/* 프로필 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SectionCard title="프로필">
            <div className="space-y-4">
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">닉네임</label>
                <div className="flex gap-2">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    maxLength={20}
                    className="flex-1 bg-[#1a1d27] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500/40"
                  />
                  <button
                    onClick={() => nicknameMut.mutate(nickname)}
                    disabled={!nickname.trim() || nickname === user?.nickname || nicknameMut.isPending}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition"
                  >
                    {nicknameMut.isPending ? '저장 중...' : '저장'}
                  </button>
                </div>
                {nicknameMsg && (
                  <p className={`text-xs mt-1.5 ${nicknameMsg.includes('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {nicknameMsg}
                  </p>
                )}
              </div>
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">이메일</label>
                <p className="text-slate-300 text-sm bg-[#1a1d27] border border-white/[0.05] rounded-xl px-3.5 py-2.5">
                  {user?.email}
                </p>
              </div>
            </div>
          </SectionCard>
        </motion.div>

        {/* 관심 분야 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <SectionCard title="관심 분야">
            <div className="grid grid-cols-2 gap-2 mb-4">
              {INTERESTS.map((item) => {
                const active = selectedInterests.includes(item.value);
                return (
                  <button
                    key={item.value}
                    onClick={() => toggleInterest(item.value)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all text-left ${
                      active
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-300'
                        : 'bg-[#1a1d27] border-white/[0.07] text-slate-400 hover:border-white/[0.15]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => interestsMut.mutate(selectedInterests)}
              disabled={
                interestsMut.isPending ||
                selectedInterests.length === 0 ||
                JSON.stringify([...selectedInterests].sort()) === JSON.stringify([...(user?.interests ?? [])].sort())
              }
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-medium rounded-xl transition"
            >
              {interestsMut.isPending ? '저장 중...' : '관심 분야 저장'}
            </button>
            {interestsMsg && (
              <p className={`text-xs mt-2 text-center ${interestsMsg.includes('✓') ? 'text-emerald-400' : 'text-red-400'}`}>
                {interestsMsg}
              </p>
            )}
          </SectionCard>
        </motion.div>

        {/* 계정 정보 */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <SectionCard title="계정 정보">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm">로그인 방법</span>
              <span className="text-slate-200 text-sm font-medium">
                {PROVIDER_LABELS[(user as any)?.provider ?? 'local'] ?? '이메일'}
              </span>
            </div>
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <button
                disabled
                className="text-red-400/50 text-sm cursor-not-allowed"
                title="준비 중"
              >
                회원탈퇴 (준비 중)
              </button>
            </div>
          </SectionCard>
        </motion.div>
      </main>
    </div>
  );
}
