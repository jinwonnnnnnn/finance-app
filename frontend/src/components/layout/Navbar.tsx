import { Link, useLocation } from 'react-router-dom';
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
  const { user, logout } = useAuthStore();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1a1d27]/80 backdrop-blur border-b border-slate-800">
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

        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm hidden md:block">{user?.nickname}</span>
          <button
            onClick={logout}
            className="text-slate-500 hover:text-red-400 text-sm transition"
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 모바일 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1a1d27] border-t border-slate-800 flex">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex-1 flex flex-col items-center py-3 text-xs transition ${
              location.pathname === tab.path ? 'text-indigo-400' : 'text-slate-500'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
