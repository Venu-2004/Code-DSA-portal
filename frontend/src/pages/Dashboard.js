import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import DashboardCharts from '../components/DashboardCharts';
import RecommendationList from '../components/RecommendationList';

function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user && user.id) {
      fetchDashboardData();
    } else if (!authLoading && !user) {
      setError('User not found. Please log in again.');
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchDashboardData = async () => {
    if (!user || !user.id) {
      setError('User not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const response = await api.get(`/dashboard/${user.id}`);
      setStats(response.data);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.warn('Authentication error - redirecting to login');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (!err.response) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Failed to load dashboard data. Please try again.');
      }
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-rose-300 text-xl mb-4">{error}</div>
          <button onClick={fetchDashboardData} className="btn-primary">Try Again</button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: 'Problems Solved',
      value: stats?.solvedProblems || 0,
      accent: 'from-cyan-500/30 to-cyan-600/10'
    },
    {
      label: 'Overall Accuracy',
      value: `${stats?.overallAccuracy ? Math.round(stats.overallAccuracy) : 0}%`,
      accent: 'from-emerald-500/30 to-emerald-600/10'
    },
    {
      label: 'Total Submissions',
      value: stats?.totalSubmissions || 0,
      accent: 'from-amber-500/30 to-amber-600/10'
    },
    {
      label: 'Problems Available',
      value: stats?.totalProblems || 0,
      accent: 'from-indigo-500/30 to-indigo-600/10'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <section className="card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/15 via-transparent to-transparent pointer-events-none"></div>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-50">
          Welcome, {user.username}
        </h1>
        <p className="mt-2 text-slate-300 max-w-2xl">
          Track your coding consistency, find weak areas, and follow AI-picked problems to improve faster.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((item) => (
          <div key={item.label} className="card card-hover">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.accent} border border-cyan-300/20 mb-4`}></div>
            <p className="text-sm text-slate-300">{item.label}</p>
            <p className="text-3xl font-bold text-slate-50 mt-1">{item.value}</p>
          </div>
        ))}
      </section>

      <DashboardCharts stats={stats} />
      <RecommendationList recommendations={stats?.recommendedProblems} title="AI Recommendations For You" />

      {stats?.recentSubmissions && stats.recentSubmissions.length > 0 && (
        <section className="card">
          <h3 className="text-xl font-semibold text-slate-50 mb-4">Recent Submissions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-700/70">
                  <th className="px-4 py-3">Problem</th>
                  <th className="px-4 py-3">Language</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-3 text-sm text-slate-100">{submission.problemTitle}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{submission.language}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        submission.status === 'ACCEPTED' ? 'badge-easy' :
                        submission.status === 'WRONG_ANSWER' ? 'badge-hard' : 'badge-medium'
                      }`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">{new Date(submission.submittedAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

export default Dashboard;
