import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register } = useAuth();
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    const mobile = formData.mobileNumber.trim();
    if (!/^[0-9+\-()\s]{10,20}$/.test(mobile)) {
      setError('Please enter a valid mobile number (10-20 characters)');
      return;
    }

    setLoading(true);
    const result = await register(
      formData.username.trim(),
      formData.email.trim(),
      mobile,
      formData.password
    );

    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(typeof result.error === 'string' ? result.error : 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="auth-shell min-h-screen flex items-center justify-center px-4 py-10">
      <div className="auth-card w-full max-w-xl animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-cyan-500/20 border border-cyan-300/40 flex items-center justify-center shadow-neon">
            <span className="text-cyan-100 font-bold text-xl">code</span>
          </div>
          <h2 className="mt-5 text-3xl font-bold text-slate-50 tracking-tight">Create Account</h2>
          <p className="mt-2 text-sm text-slate-300">Build your personalized DSA journey</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="username" className="label">User Name</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="input"
                placeholder="Choose a unique username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="mobileNumber" className="label">Mobile Number</label>
              <input
                id="mobileNumber"
                name="mobileNumber"
                type="text"
                required
                className="input"
                placeholder="10-20 characters"
                value={formData.mobileNumber}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="label">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="input"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input pr-11"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a15.64 15.64 0 0 1-4.3 5.58" />
                      <path d="M6.61 6.61A15.73 15.73 0 0 0 2 12s3 8 10 8a10.94 10.94 0 0 0 5.76-1.61" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="label">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="input pr-11"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-100"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58A2 2 0 0 0 12 14a2 2 0 0 0 1.42-.58" />
                      <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 10 8 10 8a15.64 15.64 0 0 1-4.3 5.58" />
                      <path d="M6.61 6.61A15.73 15.73 0 0 0 2 12s3 8 10 8a10.94 10.94 0 0 0 5.76-1.61" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-sm text-center text-slate-300">
            Already have an account?{' '}
            <Link to="/login" className="text-cyan-300 hover:text-cyan-200 font-semibold">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
