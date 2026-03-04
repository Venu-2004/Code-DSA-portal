import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

function Profile() {
  const { user, loading: authLoading, updateUserProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    mobileNumber: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  useEffect(() => {
    if (!authLoading && user && user.id) {
      fetchProfileData();
    } else if (!authLoading && !user) {
      setError('User not found. Please log in again.');
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchProfileData = async () => {
    if (!user || !user.id) {
      setError('User not found. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setProfileMessage('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const [profileResponse, statsResponse, submissionsResponse] = await Promise.all([
        api.get('/users/me'),
        api.get(`/submissions/stats/user/${user.id}`),
        api.get(`/submissions/user/${user.id}`)
      ]);

      setProfile(profileResponse.data);
      setForm((prev) => ({
        ...prev,
        username: profileResponse.data.username || '',
        email: profileResponse.data.email || '',
        mobileNumber: profileResponse.data.mobileNumber || '',
        profileImage: profileResponse.data.profileImage || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
      setStats(statsResponse.data);
      setSubmissions(submissionsResponse.data.slice(0, 10));
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.warn('Authentication error - redirecting to login');
      } else if (err.response?.status >= 500) {
        setError('Server error. Please try again later.');
      } else if (!err.response) {
        setError('Unable to connect to server. Please check your connection.');
      } else {
        setError('Failed to load profile data. Please try again.');
      }
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileFieldChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setProfileMessage('Please upload a valid image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setProfileMessage('Image size must be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profileImage: typeof reader.result === 'string' ? reader.result : ''
      }));
      setProfileMessage('');
    };
    reader.onerror = () => {
      setProfileMessage('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    if (!form.username.trim() || !form.email.trim() || !form.mobileNumber.trim()) {
      setProfileMessage('Username, email and mobile number are required.');
      return;
    }

    if (form.newPassword && form.newPassword !== form.confirmNewPassword) {
      setProfileMessage('New password and confirm password do not match.');
      return;
    }

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      mobileNumber: form.mobileNumber.trim(),
      profileImage: form.profileImage || ''
    };

    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    try {
      setSavingProfile(true);
      const result = await updateUserProfile(payload);
      if (!result.success) {
        setProfileMessage(result.error || 'Failed to update profile.');
        return;
      }

      setProfile((prev) => ({
        ...prev,
        username: result.user.username,
        email: result.user.email,
        mobileNumber: result.user.mobileNumber,
        profileImage: result.user.profileImage
      }));
      setForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      }));
      setIsEditing(false);
      setProfileMessage('Profile updated successfully.');
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return 'text-green-600 bg-green-100';
      case 'WRONG_ANSWER':
      case 'RUNTIME_ERROR':
      case 'COMPILATION_ERROR':
        return 'text-red-600 bg-red-100';
      case 'TIME_LIMIT_EXCEEDED':
      case 'MEMORY_LIMIT_EXCEEDED':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button onClick={fetchProfileData} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const displayUser = profile || user;

  const avatarImage = form.profileImage || displayUser?.profileImage;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="card">
        <div className="flex items-center space-x-6">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center overflow-hidden">
            {avatarImage ? (
              <img
                src={avatarImage}
                alt={`${displayUser?.username || 'User'} profile`}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-2xl font-bold">
                {displayUser?.username?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{displayUser?.username}</h1>
            <p className="text-gray-600">{displayUser?.email}</p>
            <p className="text-gray-500 text-sm">Mobile: {displayUser?.mobileNumber}</p>
            <p className="text-sm text-gray-500">
              Member since {new Date(displayUser?.createdAt || Date.now()).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {stats?.acceptedSubmissions || 0}
          </div>
          <div className="text-gray-600">Problems Solved</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-success-600 mb-2">
            {stats?.totalSubmissions || 0}
          </div>
          <div className="text-gray-600">Total Submissions</div>
        </div>

        <div className="card text-center">
          <div className="text-3xl font-bold text-warning-600 mb-2">
            {stats?.averageAccuracy ? Math.round(stats.averageAccuracy) : 0}%
          </div>
          <div className="text-gray-600">Average Accuracy</div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Submissions</h2>

        {submissions.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">No submissions yet. Start solving problems!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.problemTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.language}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                        {submission.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.accuracy ? `${Math.round(submission.accuracy)}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setProfileMessage('');
              }}
              className="btn-secondary"
            >
              Edit Profile
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setProfileMessage('');
                setForm((prev) => ({
                  ...prev,
                  username: displayUser?.username || '',
                  email: displayUser?.email || '',
                  mobileNumber: displayUser?.mobileNumber || '',
                  profileImage: displayUser?.profileImage || '',
                  currentPassword: '',
                  newPassword: '',
                  confirmNewPassword: ''
                }));
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
        </div>

        {profileMessage && (
          <div className={`mb-4 p-3 rounded ${profileMessage.includes('successfully') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {profileMessage}
          </div>
        )}

        <form onSubmit={handleProfileSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            {isEditing ? (
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={handleProfileFieldChange}
                className="input"
                required
              />
            ) : (
              <div className="input bg-gray-50 cursor-not-allowed">{displayUser?.username}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleProfileFieldChange}
                className="input"
                required
              />
            ) : (
              <div className="input bg-gray-50 cursor-not-allowed">{displayUser?.email}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <div className="input bg-gray-50 cursor-not-allowed">{displayUser?.role}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
            {isEditing ? (
              <input
                type="text"
                name="mobileNumber"
                value={form.mobileNumber}
                onChange={handleProfileFieldChange}
                className="input"
                required
              />
            ) : (
              <div className="input bg-gray-50 cursor-not-allowed">{displayUser?.mobileNumber}</div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Member Since</label>
            <div className="input bg-gray-50 cursor-not-allowed">
              {new Date(displayUser?.createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
            {isEditing ? (
              <div className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  className="input"
                />
                {form.profileImage && (
                  <div className="flex items-center gap-3">
                    <img src={form.profileImage} alt="Preview" className="w-14 h-14 rounded-full object-cover border border-slate-500" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, profileImage: '' }))}
                      className="btn-secondary text-sm"
                    >
                      Remove Image
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                {displayUser?.profileImage ? 'Image uploaded' : 'No profile image'}
              </div>
            )}
          </div>

          {isEditing && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleProfileFieldChange}
                  className="input"
                  placeholder="Required only to change password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={form.newPassword}
                  onChange={handleProfileFieldChange}
                  className="input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={form.confirmNewPassword}
                  onChange={handleProfileFieldChange}
                  className="input"
                />
              </div>

              <div className="md:col-span-2 flex justify-end">
                <button
                  type="submit"
                  className="btn-primary disabled:opacity-50"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

export default Profile;
