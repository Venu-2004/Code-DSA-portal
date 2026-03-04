import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const initialProblemData = {
  title: '',
  description: '',
  difficulty: 'EASY',
  topic: 'ARRAYS',
  inputFormat: '',
  outputFormat: '',
  constraints: '',
  timeLimit: 1000,
  memoryLimit: 256,
  hint: '',
  sampleInput: '',
  sampleOutput: ''
};

const topics = [
  'ARRAYS', 'STRINGS', 'TREES', 'GRAPHS', 'DYNAMIC_PROGRAMMING', 'GREEDY',
  'SORTING', 'SEARCHING', 'MATH', 'HASH_TABLE', 'STACK', 'QUEUE',
  'LINKED_LIST', 'BINARY_TREE', 'HEAP'
];

function formatDuration(totalSeconds) {
  const safeSeconds = Number(totalSeconds || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState({
    totalStudents: 0,
    totalSolvedProblems: 0,
    totalPlatformTimeSeconds: 0,
    averageAccuracy: 0,
    leaderboard: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [problemData, setProblemData] = useState(initialProblemData);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUserData, setEditingUserData] = useState({ username: '', email: '' });
  const [updatingUser, setUpdatingUser] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }

    if (activeTab === 'users') {
      fetchUsers();
      return;
    }
    if (activeTab === 'leaderboard') {
      fetchLeaderboard();
      return;
    }
    if (activeTab === 'problems') {
      fetchProblems();
    }
  }, [user, navigate, activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/leaderboard');
      setLeaderboardData(response.data);
    } catch (err) {
      setError('Failed to fetch leaderboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProblems = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/problems');
      setProblems(response.data);
    } catch (err) {
      setError('Failed to fetch problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetProblemForm = () => {
    setEditingProblemId(null);
    setProblemData(initialProblemData);
  };

  const handleProblemSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      if (!problemData.sampleInput.trim() || !problemData.sampleOutput.trim()) {
        setError('Sample test case input and output are required.');
        return;
      }

      const payload = {
        title: problemData.title,
        description: problemData.description,
        difficulty: problemData.difficulty,
        topic: problemData.topic,
        inputFormat: problemData.inputFormat,
        outputFormat: problemData.outputFormat,
        constraints: problemData.constraints,
        timeLimit: problemData.timeLimit,
        memoryLimit: problemData.memoryLimit,
        hint: problemData.hint,
        testCases: [
          {
            inputData: problemData.sampleInput,
            expectedOutput: problemData.sampleOutput,
            isSample: true
          }
        ]
      };

      if (editingProblemId) {
        await api.put(`/problems/${editingProblemId}`, payload);
        setSuccessMessage('Problem updated successfully.');
      } else {
        await api.post('/problems', payload);
        setSuccessMessage('Problem created successfully.');
      }

      resetProblemForm();
      await fetchProblems();
    } catch (err) {
      setError(editingProblemId ? 'Failed to update problem' : 'Failed to create problem');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProblem = (problem) => {
    const sampleCase = (problem.testCases || []).find((tc) => tc.isSample) || (problem.testCases || [])[0];
    setEditingProblemId(problem.id);
    setProblemData({
      title: problem.title || '',
      description: problem.description || '',
      difficulty: problem.difficulty || 'EASY',
      topic: problem.topic || 'ARRAYS',
      inputFormat: problem.inputFormat || '',
      outputFormat: problem.outputFormat || '',
      constraints: problem.constraints || '',
      timeLimit: problem.timeLimit || 1000,
      memoryLimit: problem.memoryLimit || 256,
      hint: problem.hint || '',
      sampleInput: sampleCase?.inputData || '',
      sampleOutput: sampleCase?.expectedOutput || ''
    });
    setSuccessMessage('');
    setError('');
  };

  const handleDeleteProblem = async (problemId) => {
    const confirmed = window.confirm('Are you sure you want to delete this problem?');
    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await api.delete(`/problems/${problemId}`);
      setSuccessMessage('Problem deleted successfully.');
      if (editingProblemId === problemId) {
        resetProblemForm();
      }
      await fetchProblems();
    } catch (err) {
      setError('Failed to delete problem');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProblemData((prev) => ({
      ...prev,
      [name]: (name === 'timeLimit' || name === 'memoryLimit') ? Number(value) : value
    }));
  };

  const handleStartUserEdit = (targetUser) => {
    setEditingUserId(targetUser.id);
    setEditingUserData({
      username: targetUser.username || '',
      email: targetUser.email || ''
    });
    setError('');
    setSuccessMessage('');
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setEditingUserData({ username: '', email: '' });
  };

  const handleEditingUserField = (field, value) => {
    setEditingUserData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveUserEdit = async (userId) => {
    const trimmedUsername = editingUserData.username.trim();
    const trimmedEmail = editingUserData.email.trim();

    if (!trimmedUsername || !trimmedEmail) {
      setError('Username and email are required.');
      return;
    }

    try {
      setUpdatingUser(true);
      setError('');
      setSuccessMessage('');

      const response = await api.put(`/admin/users/${userId}`, {
        username: trimmedUsername,
        email: trimmedEmail
      });

      setUsers((prevUsers) =>
        prevUsers.map((existingUser) =>
          existingUser.id === userId ? response.data : existingUser
        )
      );

      setSuccessMessage('User updated successfully.');
      handleCancelUserEdit();
    } catch (err) {
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : 'Failed to update user';
      setError(message);
      console.error(err);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (!targetUser?.id) {
      return;
    }

    if (targetUser.role === 'ADMIN') {
      setError('Admin account cannot be deleted.');
      return;
    }

    if (user?.id === targetUser.id) {
      setError('You cannot delete your own account.');
      return;
    }

    const confirmed = window.confirm(`Delete user "${targetUser.username}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      setUpdatingUser(true);
      setError('');
      setSuccessMessage('');

      await api.delete(`/admin/users/${targetUser.id}`);

      setUsers((prevUsers) => prevUsers.filter((existingUser) => existingUser.id !== targetUser.id));
      if (editingUserId === targetUser.id) {
        handleCancelUserEdit();
      }
      setSuccessMessage('User deleted successfully.');
    } catch (err) {
      const message = typeof err.response?.data === 'string'
        ? err.response.data
        : 'Failed to delete user';
      setError(message);
      console.error(err);
    } finally {
      setUpdatingUser(false);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

        {error && activeTab !== 'problems' && (
          <div className="p-4 mb-6 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {successMessage && activeTab === 'users' && (
          <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        <div className="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            className={`pb-2 px-4 font-medium transition-colors duration-200 ${
              activeTab === 'users'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('users')}
          >
            Manage Users
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors duration-200 ${
              activeTab === 'leaderboard'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('leaderboard')}
          >
            Leaderboard
          </button>
          <button
            className={`pb-2 px-4 font-medium transition-colors duration-200 ${
              activeTab === 'problems'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('problems')}
          >
            Manage Problems
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Solved</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {editingUserId === u.id ? (
                          <input
                            type="text"
                            className="border border-gray-300 rounded-md px-2 py-1 w-48"
                            value={editingUserData.username}
                            onChange={(e) => handleEditingUserField('username', e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{u.username}</span>
                            <button
                              type="button"
                              onClick={() => handleStartUserEdit(u)}
                              className="text-primary-600 hover:text-primary-800 text-xs"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingUserId === u.id ? (
                          <input
                            type="email"
                            className="border border-gray-300 rounded-md px-2 py-1 w-64"
                            value={editingUserData.email}
                            onChange={(e) => handleEditingUserField('email', e.target.value)}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{u.email}</span>
                            <button
                              type="button"
                              onClick={() => handleStartUserEdit(u)}
                              className="text-primary-600 hover:text-primary-800 text-xs"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.solvedProblems}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {u.averageAccuracy ? Math.round(u.averageAccuracy) : 0}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(u.totalActiveSeconds)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingUserId === u.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={updatingUser}
                              onClick={() => handleSaveUserEdit(u.id)}
                              className="px-3 py-1 rounded bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              disabled={updatingUser}
                              onClick={handleCancelUserEdit}
                              className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingUser || u.role === 'ADMIN' || user?.id === u.id}
                            onClick={() => handleDeleteUser(u)}
                            className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">Students</p>
                    <p className="text-2xl font-bold text-slate-800">{leaderboardData.totalStudents || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">Total Solved</p>
                    <p className="text-2xl font-bold text-slate-800">{leaderboardData.totalSolvedProblems || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">Avg Accuracy</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {Math.round(leaderboardData.averageAccuracy || 0)}%
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-500">Platform Time</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {formatDuration(leaderboardData.totalPlatformTimeSeconds)}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solved</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submissions</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Spent</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(leaderboardData.leaderboard || []).map((entry) => (
                        <tr key={entry.userId}>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">#{entry.rank}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{entry.username}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.solvedProblems || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{entry.totalSubmissions || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {Math.round(entry.averageAccuracy || 0)}%
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDuration(entry.totalActiveSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'problems' && (
          <div className="space-y-8">
            {successMessage && (
              <div className="p-4 bg-green-50 text-green-700 rounded-md">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="overflow-x-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">All Problems</h2>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Difficulty</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topic</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {problems.map((problem) => (
                      <tr key={problem.id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{problem.title}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{problem.difficulty}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{problem.topic}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEditProblem(problem)}
                              className="px-3 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProblem(problem.id)}
                              className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="max-w-3xl">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingProblemId ? 'Edit Problem' : 'Add Problem'}
                </h2>
                {editingProblemId && (
                  <button
                    type="button"
                    onClick={resetProblemForm}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>

              <form onSubmit={handleProblemSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      value={problemData.title}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Topic</label>
                    <select
                      name="topic"
                      value={problemData.topic}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    >
                      {topics.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Difficulty</label>
                    <select
                      name="difficulty"
                      value={problemData.difficulty}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Time Limit (ms)</label>
                    <input
                      type="number"
                      name="timeLimit"
                      value={problemData.timeLimit}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    name="description"
                    required
                    rows={4}
                    value={problemData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Input Format</label>
                    <textarea
                      name="inputFormat"
                      rows={3}
                      value={problemData.inputFormat}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Output Format</label>
                    <textarea
                      name="outputFormat"
                      rows={3}
                      value={problemData.outputFormat}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Constraints</label>
                  <textarea
                    name="constraints"
                    rows={3}
                    value={problemData.constraints}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sample Input (Required)</label>
                    <textarea
                      name="sampleInput"
                      rows={3}
                      required
                      value={problemData.sampleInput}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                      placeholder="Example input used for execution check"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sample Output (Required)</label>
                    <textarea
                      name="sampleOutput"
                      rows={3}
                      required
                      value={problemData.sampleOutput}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                      placeholder="Expected output for sample input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hint</label>
                  <textarea
                    name="hint"
                    rows={2}
                    value={problemData.hint}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    placeholder="Optional hint for the problem"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Memory Limit (MB)</label>
                    <input
                      type="number"
                      name="memoryLimit"
                      value={problemData.memoryLimit}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2 border"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  {editingProblemId && (
                    <button
                      type="button"
                      onClick={resetProblemForm}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingProblemId ? 'Update Problem' : 'Create Problem'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
