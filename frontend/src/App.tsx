
import React, { useCallback, useEffect, useState } from 'react';
import { Feed } from './components/Feed';
import { Leaderboard } from './components/Leaderboard';
import { LoginModal } from './components/LoginModal';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { apiService } from './services/api';
import { User } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const updateUserData = useCallback(async () => {
    try {
      const user = await apiService.getCurrentUser();
      setCurrentUser({ ...user });
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      // Always refresh user data to clear state even if API fails
      await updateUserData();
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    updateUserData();
  }, [updateUserData]);

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb] text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 shadow-lg shadow-indigo-200">
              <span className="text-xl font-black text-white">P</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">Playto</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Community Feed</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser?.username === 'Guest' ? (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700"
              >
                Login
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-4 rounded-full border border-slate-200 bg-white p-1 pr-4 shadow-sm cursor-pointer hover:border-slate-300 transition" onClick={updateUserData}>
                  <Avatar>
                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.username} />
                    <AvatarFallback>{currentUser?.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-800 leading-tight">{currentUser?.username}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-bold text-indigo-600">{currentUser?.totalKarma.toLocaleString()} KARMA</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="mx-auto mt-8 flex max-w-6xl flex-col gap-8 px-4 pb-24 lg:flex-row">
        {/* Main Feed Section */}
        <section className="flex-1">
          <Feed
            currentUser={currentUser}
            onKarmaUpdate={updateUserData}
          />
        </section>

        {/* Sidebar Section */}
        <aside className="w-full lg:w-[340px] shrink-0">
          <div className="sticky top-24 space-y-6">
            <Leaderboard refreshTrigger={refreshTrigger} />

            {/* Gamification Rules Card */}
            <div className="overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50/50 to-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-indigo-600 p-1.5 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Gamification Guide</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Post Like</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">+5 Karma</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">Comment Like</span>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">+1 Karma</span>
                </div>
                <p className="px-1 text-[11px] text-slate-400 leading-relaxed font-medium">
                  Karma updates reflect recent activity — stay active to increase your rank.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Login Modal */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;
