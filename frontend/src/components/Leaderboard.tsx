
import React, { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Card, CardContent, CardHeader } from './ui/card';

interface LeaderboardProps {
  refreshTrigger?: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ refreshTrigger }) => {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaders = async () => {
    try {
      setLoading(true);
      const data = await apiService.getLeaderboard();
      setTopUsers(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaders();
    const interval = setInterval(fetchLeaders, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLeaders();
  }, [refreshTrigger]);

  return (
    <Card>
      <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-widest">Global Top 5 (24h)</h2>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5">
            <div className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tighter">Live 24h</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-slate-50 p-2">
        {loading ? (
          <div className="text-center text-sm text-slate-400 py-10 font-medium italic">Loading leaderboard...</div>
        ) : topUsers.length > 0 ? (
          topUsers.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between p-3 transition-colors hover:bg-slate-50 rounded-xl group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.username} />
                    <AvatarFallback>{user.username.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black border-2 border-white shadow-sm ${
                    index === 0 ? 'bg-yellow-400 text-yellow-900' : 
                    index === 1 ? 'bg-slate-300 text-slate-700' :
                    index === 2 ? 'bg-orange-300 text-orange-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {index + 1}
                  </div>
                </div>
                <div>
                  <span className="block text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                    {user.username}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Contributor</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-sm font-black ${(user.recentKarma ?? 0) > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                  +{user.recentKarma ?? 0}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Karma (24h)</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-sm text-slate-400 py-10 font-medium italic">No leaderboard data yet...</p>
        )}
      </CardContent>
    </Card>
  );
};
