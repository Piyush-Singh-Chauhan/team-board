import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiArrowLeft, FiEye, FiEyeOff, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import Footer from '../footer/Footer.jsx';
import { forgotPassword, resendForgotPasswordOTP, verifyForgotPasswordOTP, resetPassword } from '../../api/auth.js';
import Swal from 'sweetalert2';

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

export default function ForgetPassword() {
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ 
    email: '', 
    otp: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [touched, setTouched] = useState({ 
    email: false, 
    otp: false, 
    password: false, 
    confirmPassword: false 
  });
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const emailError = validateEmail(email);
    if (emailError) {
      setFieldErrors({ ...fieldErrors, email: emailError });
      setTouched({ ...touched, email: true });
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setStep(2);
        setError('');
        setCountdown(60);
      } else {
        setError(result.message || 'Failed to send OTP.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      const result = await resendForgotPasswordOTP(email);
      setResendLoading(false);
      
      if (result.success) {
        setResendSuccess(true);
        setCountdown(60);
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
        setTimeout(() => setResendSuccess(false), 3000);
      } else {
        setError(result.message || 'Failed to resend OTP.');
      }
    } catch (err) {
      setResendLoading(false);
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  const handleOtpChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);
    if (pastedData.length === 6) {
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter 6-digit OTP.');
      return;
    }

    setError('');
    setOtpLoading(true);

    try {
      const result = await verifyForgotPasswordOTP(email, otpString);
      if (result.success) {
        setStep(3);
        setError('');
      } else {
        setError(result.message || 'Invalid or expired OTP.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    const confirmPasswordError = password !== confirmPassword 
      ? 'Passwords do not match.' 
      : '';

    if (passwordError || confirmPasswordError) {
      setFieldErrors({
        ...fieldErrors,
        password: passwordError,
        confirmPassword: confirmPasswordError,
      });
      setTouched({
        ...touched,
        password: true,
        confirmPassword: true,
      });
      return;
    }

    setLoading(true);
    try {
      const otpString = otp.join('');
      const result = await resetPassword(email, otpString, password);
      if (result.success) {
        await Swal.fire({
          title: 'Password Reset Successful!',
          text: 'Your password has been reset successfully. Please login with new password.',
          icon: 'success',
          confirmButtonColor: '#3b82f6',
          confirmButtonText: 'Go to Login',
        });
        navigate('/login');
      } else {
        setError(result.message || 'Failed to reset password.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">TeamBoard</h1>
            <p className="text-gray-600">
              {step === 1 && 'Reset your password'}
              {step === 2 && 'Enter OTP sent to your email'}
              {step === 3 && 'Set your new password'}
            </p>
          </div>

          <div className="card border shadow-xl">
            {step === 1 && (
              <form onSubmit={handleEmailSubmit} className="space-y-6" noValidate>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Please enter your Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        // Validate immediately on change
                        setFieldErrors({ ...fieldErrors, email: validateEmail(e.target.value) });
                      }}
                      onBlur={(e) => {
                        const lowerEmail = e.target.value.toLowerCase().trim();
                        if (lowerEmail !== email) {
                          setEmail(lowerEmail);
                        }
                        setTouched({ ...touched, email: true });
                        setFieldErrors({ ...fieldErrors, email: validateEmail(lowerEmail) });
                      }}
                      className={`input pl-10 ${fieldErrors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="you@example.com"
                      maxLength={60}
                      required
                    />
                  </div>
                  {fieldErrors.email && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.email}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}
            {step === 2 && (
              <form onSubmit={handleOtpSubmit} className="space-y-6" noValidate>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                {resendSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <FiCheckCircle className="h-5 w-5" />
                    OTP resent successfully!
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                    Enter 6-digit OTP
                  </label>
                  <div className="flex justify-center gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        onPaste={index === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
                        autoFocus={index === 0}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="btn btn-primary w-full"
                >
                  {otpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || countdown > 0}
                    className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiRefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                    {resendLoading ? 'Resending...' : countdown > 0 ? `Resend OTP (${countdown}s)` : 'Resend OTP'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setCountdown(0);
                      setOtp(['', '', '', '', '', '']);
                    }}
                    className="w-full text-sm text-gray-600 hover:text-primary-600"
                  >
                    Change Email Address
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePasswordSubmit} className="space-y-6" noValidate>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        // Validate immediately on change
                        setFieldErrors({ ...fieldErrors, password: validatePassword(e.target.value) });
                        // Re-validate confirm password if it has a value
                        if (confirmPassword) {
                          const error = confirmPassword !== e.target.value ? 'Passwords do not match' : '';
                          setFieldErrors(prev => ({ ...prev, confirmPassword: error }));
                        }
                      }}
                      onBlur={() => {
                        setTouched({ ...touched, password: true });
                        setFieldErrors({ ...fieldErrors, password: validatePassword(password) });
                      }}
                      className={`input pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Enter new password"
                      maxLength={15}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.password}</p>
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
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        // Validate immediately on change
                        const error = e.target.value !== password ? 'Passwords do not match.' : '';
                        setFieldErrors({ ...fieldErrors, confirmPassword: error });
                      }}
                      onBlur={() => {
                        setTouched({ ...touched, confirmPassword: true });
                        const error = confirmPassword !== password ? 'Passwords do not match.' : '';
                        setFieldErrors({ ...fieldErrors, confirmPassword: error });
                      }}
                      className={`input pl-10 pr-10 ${fieldErrors.confirmPassword ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                      maxLength={15}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FiEyeOff className="h-5 w-5" /> : <FiEye className="h-5 w-5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">{fieldErrors.confirmPassword}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full flex items-center justify-center gap-2"
                >
                  {loading ? 'Resetting Password...' : 'Reset Password'}
                </button>
              </form>
            )}
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-2"
              >
                <FiArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};
