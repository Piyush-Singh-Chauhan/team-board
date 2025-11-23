import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { register as registerAPI } from '../../api/auth.js';
import { FiUser, FiMail, FiLock, FiUserPlus, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import Footer from '../footer/Footer.jsx';

const normalizeWhitespace = (value = '') => value.replace(/\s+/g, ' ').trim();

const formatName = (value = '') => {
  const normalized = normalizeWhitespace(value);
  if (!normalized) return '';
  
  // Split by spaces and capitalize first letter of each word, rest lowercase
  return normalized
    .split(' ')
    .map(word => {
      if (!word) return '';
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

const validateName = (value) => {
  const name = formatName(value);

  if (!name) {
    return 'Please enter your name.';
  }

  if (name.length < 2) {
    return 'Name must be at least 2 characters.';
  }

  if (name.length > 50) {
    return 'Name cannot exceed 50 characters.';
  }

  if (!/^[A-Za-z\s]+$/.test(name)) {
    return 'Name can only include letters and spaces.';
  }

  // Check if first letter is capital
  if (!/^[A-Z]/.test(name.charAt(0))) {
    return 'First letter must be a capital letter.';
  }

  // Check format: first letter capital, rest lowercase, space ke baad capital
  const words = name.split(' ');
  for (let word of words) {
    if (word.length === 0) continue;
    // First character should be capital
    if (!/^[A-Z]/.test(word.charAt(0))) {
      return 'Each word must start with a capital letter.';
    }
    // Rest should be lowercase
    if (word.length > 1 && !/^[A-Z][a-z]*$/.test(word)) {
      return 'After first letter, all characters should be lowercase.';
    }
  }

  return '';
};

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
    return 'Email must contain a valid domain (e.g., example.com).';
  }

  if (domainParts[domainParts.length - 1].length < 2) {
    return 'Email domain extension must be at least 2 characters.';
  }

  return '';
};

const validatePassword = (value) => {
  if (!value) {
    return 'Please enter your password.';
  }

  if (value.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  if (value.length > 15) {
    return 'Password cannot exceed 15 characters.';
  }

  return '';
};

const validateConfirmPassword = (value, password) => {
  if (!value) {
    return 'Please confirm your password.';
  }

  if (value !== password) {
    return 'Passwords do not match.';
  }

  return '';
};

const RegisterForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Restore form data from location state if available
  const savedFormData = location.state?.formData || {};
  
  const [name, setName] = useState(savedFormData.name || '');
  const [email, setEmail] = useState(savedFormData.email || '');
  const [password, setPassword] = useState(savedFormData.password || '');
  const [confirmPassword, setConfirmPassword] = useState(savedFormData.confirmPassword || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false, confirmPassword: false });
  const [loading, setLoading] = useState(false);

  const validators = {
    name: validateName,
    email: validateEmail,
    password: validatePassword,
    confirmPassword: (value) => validateConfirmPassword(value, password),
  };

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target;

    if (field === 'name') {
      setName(value);
    } else if (field === 'email') {
      setEmail(value);
    } else if (field === 'password') {
      setPassword(value);
      // Re-validate confirm password if it's already touched
      if (touched.confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(confirmPassword, value),
        }));
      }
    } else {
      setConfirmPassword(value);
    }

    // Validate immediately on change
    if (field === 'name') {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validators[field](value),
      }));
    } else if (field === 'email') {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validators[field](value),
      }));
    } else if (field === 'password') {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validators[field](value),
      }));
      // Re-validate confirm password if it has a value
      if (confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: validateConfirmPassword(confirmPassword, value),
        }));
      }
    } else if (field === 'confirmPassword') {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateConfirmPassword(value, password),
      }));
    }
  };

  const handleBlur = (field) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    let value = field === 'name' ? name : field === 'email' ? email : field === 'password' ? password : confirmPassword;

    if (field === 'name') {
      const formatted = formatName(value);
      if (formatted !== name) {
        setName(formatted);
      }
      value = formatted;
    }

    if (field === 'email') {
      value = normalizeWhitespace(value).toLowerCase();
      if (value !== email) {
        setEmail(value);
      }
    }

    if (field === 'password') {
      value = value.trim();
      if (value !== password) {
        setPassword(value);
      }
    }

    if (field === 'confirmPassword') {
      value = value.trim();
      if (value !== confirmPassword) {
        setConfirmPassword(value);
      }
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: validators[field](value),
    }));
  };

  const validateForm = () => {
    const formattedName = formatName(name);
    const formattedEmail = normalizeWhitespace(email).toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    setName(formattedName);
    setEmail(formattedEmail);
    setPassword(trimmedPassword);
    setConfirmPassword(trimmedConfirmPassword);

    const newErrors = {
      name: validators.name(formattedName),
      email: validators.email(formattedEmail),
      password: validators.password(trimmedPassword),
      confirmPassword: validateConfirmPassword(trimmedConfirmPassword, trimmedPassword),
    };

    setFieldErrors(newErrors);
    setTouched({ name: true, email: true, password: true, confirmPassword: true });

    return Object.values(newErrors).every((message) => !message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formatName(name),
        email: normalizeWhitespace(email).toLowerCase(),
        password: password.trim(),
      };

      const result = await registerAPI(payload);
      setLoading(false);

      if (result.success) {
        setFieldErrors({ name: '', email: '', password: '', confirmPassword: '' });
        setTouched({ name: false, email: false, password: false, confirmPassword: false });
        // Pass all form data to OTP page so it can be restored if user goes back
        navigate('/verify-otp', { 
          state: { 
            email: payload.email,
            formData: {
              name: payload.name,
              email: payload.email,
              password: payload.password,
              confirmPassword: confirmPassword.trim(),
            }
          } 
        });
      } else {
        setError(result.message || 'Registration failed.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">TeamBoard</h1>
          <p className="text-gray-600">Create your account to get started.</p>
        </div>

        <div className="card border shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={handleFieldChange('name')}
                  onBlur={handleBlur('name')}
                  className={`input pl-10 ${fieldErrors.name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={fieldErrors.name ? 'true' : 'false'}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                  placeholder="Aman Kumar"
                  required
                  minLength={2}
                  maxLength={50}
                />
              </div>
              {fieldErrors.name && (
                <p id="name-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.name}
                </p>
              )}
            </div>

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
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  placeholder="you@example.com"
                  maxLength={60}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p id="email-error" className="mt-2 text-sm text-red-600">
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
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handleFieldChange('password')}
                  onBlur={handleBlur('password')}
                  className={`input pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={fieldErrors.password ? 'true' : 'false'}
                  aria-describedby={fieldErrors.password ? 'password-error' : 'password-hint'}
                  placeholder="•••••••"
                  required
                  minLength={6}
                  maxLength={15}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              <p id="password-hint" className="mt-1 text-xs text-gray-500">
                Must be between 6-10 characters.
              </p>
              {fieldErrors.password && (
                <p id="password-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={handleFieldChange('confirmPassword')}
                  onBlur={handleBlur('confirmPassword')}
                  className={`input pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                  aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
                  aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
                  placeholder="•••••••"
                  required
                  minLength={6}
                  maxLength={15}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p id="confirm-password-error" className="mt-2 text-sm text-red-600">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? (
                'Sending OTP...'
              ) : (
                <>
                  <FiUserPlus className="h-5 w-5" />
                  Continue
                  <FiArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
        </div>
      <Footer />
    </div>
   
  );
};

export default RegisterForm;
