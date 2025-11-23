import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';
import Footer from '../footer/Footer.jsx';

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();

const validateEmail = (value) => {
  const email = normalizeWhitespace(value).toLowerCase();

  if (!email) {
    return 'Please enter your email.';
  }

  if (email.length > 60) {
    return 'Email cannot exceed 60 characters.';
  }

  const emailPattern = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

  if (!emailPattern.test(email)) {
    return 'Please enter a valid email address.';
  }

  const [, domain = ''] = email.split('@');
  const domainParts = domain.split('.');

  if (domainParts.length < 2 || domainParts.some((part) => part.length === 0)) {
    return 'Please enter a valid domain (e.g., example.com).';
  }

  if (domainParts[domainParts.length - 1].length < 2) {
    return 'Email domain extension must be at least 2 characters.';
  }

  return '';
};

const validatePassword = (value) => {
  const password = value.trim();

  if (!password) {
    return 'Please enter you password.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return '';
};

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validators = {
    email: validateEmail,
    password: validatePassword,
  };

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;

    if (field === 'email') {
      setEmail(value);
    } else {
      setPassword(value);
    }

    // Validate immediately on change
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validators[field](value),
    }));
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let value = field === 'email' ? email : password;

    if (field === 'email') {
      const normalized = normalizeWhitespace(value).toLowerCase();
      if (normalized !== email) {
        setEmail(normalized);
      }
      value = normalized;
    }

    if (field === 'password') {
      const trimmed = value.trim();
      if (trimmed !== password) {
        setPassword(trimmed);
      }
      value = trimmed;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: validators[field](value),
    }));
  };

  const validateForm = () => {
    const formattedEmail = normalizeWhitespace(email).toLowerCase();
    const trimmedPassword = password.trim();

    setEmail(formattedEmail);
    setPassword(trimmedPassword);

    const newErrors = {
      email: validators.email(formattedEmail),
      password: validators.password(trimmedPassword),
    };

    setFieldErrors(newErrors);
    setTouched({ email: true, password: true });

    return Object.values(newErrors).every((message) => !message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) {
      return;
    }

    const sanitizedEmail = normalizeWhitespace(email).toLowerCase();
    const trimmedPassword = password.trim();

    setEmail(sanitizedEmail);
    setPassword(trimmedPassword);

    setLoading(true);

    const result = await login({ email: sanitizedEmail, password: trimmedPassword });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TeamBoard</h1>
          <p className="text-gray-600">Welcome back! Please login to continue.</p>
        </div>

        <div className="card border shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleFieldChange('email')}
                  onBlur={handleBlur('email')}
                  className={`input pl-10 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={fieldErrors.email ? 'true' : 'false'}
                  aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                  placeholder="you@example.com"
                  minLength={2}
                  maxLength={50}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p id="login-email-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={handleFieldChange('password')}
                  onBlur={handleBlur('password')}
                  className={`input pl-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                  placeholder="••••••••"
                  minLength={6}
                  maxLength={10}
                  required
                />
              </div>
              {fieldErrors.password && (
                <p id="login-password-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                'Logging in...'
              ) : (
                <>
                  <FiLogIn className="h-5 w-5" />
                  Login
                </>
              )}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign up
              </Link>
            </p>
            <p className="text-sm">
              <Link to="/forgot-password" className="text-primary-600 hover:text-primary-700 font-medium">
                Forgot your password?
              </Link>
            </p>
          </div>
        </div>
      </div>
        </div>
      <Footer />
    </div>
    
  )
  };

export default LoginForm;
