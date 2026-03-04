import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const [formData, setFormData] = useState({
    loginId: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.loginId.trim(), formData.password.trim());
    if (result.success) {
      setFormData({ loginId: '', password: '' });
      navigate('/dashboard', { replace: true });
    } else {
      const errorMsg = typeof result.error === 'string'
        ? result.error
        : result.error?.message || result.error?.error || 'Invalid credentials';
      setError(errorMsg);
    }

    setLoading(false);
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
      <div className="auth-card w-full max-w-md animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-cyan-500/20 border border-cyan-300/40 flex items-center justify-center shadow-neon">
            <span className="text-cyan-100 font-bold text-xl">code</span>
          </div>
          <h2 className="mt-5 text-3xl font-bold text-slate-50 tracking-tight">Welcome Back</h2>
          <p className="mt-2 text-sm text-slate-300">Login with username, email, or mobile number</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="loginId" className="label">Username / Email / Mobile</label>
            <input
              id="loginId"
              name="loginId"
              type="text"
              required
              className="input"
              placeholder="e.g. testuser or test@example.com"
              value={formData.loginId}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="password" className="label">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input pr-11"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
                onClick={() => setShowPassword((prev) => !prev)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 text-rose-200 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-sm text-center text-slate-300">
            New here?{' '}
            <Link to="/register" className="text-cyan-300 hover:text-cyan-200 font-semibold">
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
