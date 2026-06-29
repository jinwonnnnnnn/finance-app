import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';

const tabs = [
  { path: '/dashboard', label: '홈', icon: '🏠' },
  { path: '/stock/us', label: '해외주식', icon: '🇺🇸' },
  { path: '/stock/kr', label: '국내주식', icon: '🇰🇷' },
  { path: '/coin', label: '코인', icon: '₿' },
  { path: '/glossary', label: '용어사전', icon: '📖' },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#1a1d27]/90 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="font-bold text-white text-lg">
            💰 핀테크입문
          </Link>

          <nav className="hidden md:flex gap-1">
            {tabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  location.pathname === tab.path
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.icon} {tab.label}
              </Link>
            ))}
          </nav>

          {/* 프로필 드롭다운 */}
          <div className="relative">
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 rounded-xl px-3 py-1.5 transition"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.nickname?.[0]?.toUpperCase() ?? 'U'}
              </div>
              <span className="text-slate-300 text-sm hidden md:block">{user?.nickname}</span>
              <span className="text-slate-500 text-xs">▾</span>
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-[#1a1d27] border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-white text-sm font-semibold">{user?.nickname}</p>
                    <p className="text-slate-500 text-xs">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      // 투어 재시작
                      localStorage.removeItem('finance-app-tour-done');
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800 text-sm transition"
                  >
                    🗺️ 가이드 다시보기
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-800 text-sm transition"
                  >
                    🚪 로그아웃
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d27]/95 backdrop-blur border-t border-slate-800 flex z-40 pb-safe">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center py-2.5 text-xs transition ${
              location.pathname === tab.path ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <span className="text-xl mb-0.5">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
        {/* 모바일 로그아웃 */}
        <button
          onClick={handleLogout}
          className="flex-none flex flex-col items-center py-2.5 px-3 text-xs text-red-500"
        >
          <span className="text-xl mb-0.5">🚪</span>
          로그아웃
        </button>
      </nav>
    </>
  );
}
