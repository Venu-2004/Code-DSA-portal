import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import ProblemCard from '../components/ProblemCard';

function ProblemList() {
  const { loading: authLoading } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    difficulty: '',
    topic: '',
    search: ''
  });

  useEffect(() => {
    if (authLoading) return;
    const delay = setTimeout(() => fetchProblems(loading), 300);
    return () => clearTimeout(delay);
  }, [filters, authLoading]);

  const fetchProblems = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsFiltering(true);
      }
      setError('');
      const params = new URLSearchParams();
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.topic) params.append('topic', filters.topic);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/problems?${params.toString()}`);
      setProblems(response.data);
    } catch (err) {
      if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (!err.response) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Failed to load problems. Please try again.');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsFiltering(false);
      }
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ difficulty: '', topic: '', search: '' });
  };

  const difficulties = ['EASY', 'MEDIUM', 'HARD'];
  const topics = [
    'ARRAYS', 'STRINGS', 'TREES', 'GRAPHS', 'DYNAMIC_PROGRAMMING',
    'GREEDY', 'SORTING', 'SEARCHING', 'MATH', 'HASH_TABLE',
    'STACK', 'QUEUE', 'LINKED_LIST', 'BINARY_TREE', 'HEAP'
  ];

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-primary-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-50">Problem Library</h1>
            <p className="text-slate-300 text-sm mt-1">Search by topic, difficulty, and keywords</p>
          </div>
          <div className="text-sm text-slate-300">
            {problems.length} problem{problems.length !== 1 ? 's' : ''} available
          </div>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div>
            <label className="label">
              Search {isFiltering && <span className="text-xs text-slate-400 ml-1">(updating...)</span>}
            </label>
            <input
              type="text"
              placeholder="Find a problem..."
              className="input"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>

          <div>
            <label className="label">Difficulty</label>
            <select
              className="input"
              value={filters.difficulty}
              onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            >
              <option value="">All Difficulties</option>
              {difficulties.map((diff) => (
                <option key={diff} value={diff}>{diff}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Topic</label>
            <select
              className="input"
              value={filters.topic}
              onChange={(e) => handleFilterChange('topic', e.target.value)}
            >
              <option value="">All Topics</option>
              {topics.map((topic) => (
                <option key={topic} value={topic}>{topic.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button onClick={clearFilters} className="btn-secondary w-full">Reset</button>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 px-4 py-3">
          {error}
        </div>
      )}

      {problems.length === 0 ? (
        <div className="card text-center py-14">
          <h3 className="text-xl font-semibold text-slate-100 mb-2">No matching problems</h3>
          <p className="text-slate-300">Try changing search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {problems.map((problem) => (
            <ProblemCard key={problem.id} problem={problem} />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProblemList;
