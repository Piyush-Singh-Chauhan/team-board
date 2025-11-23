import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { verifyCode as verifyCodeAPI, resendCode as resendCodeAPI } from '../../api/auth.js';
import { FiMail, FiArrowLeft, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';
import Footer from '../footer/Footer.jsx';

const VerifyOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshTeams, setUser: setAuthUser } = useAuth();
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return; 
    
    const newOtp = [...otp];
    newOtp[index] = value.replace(/[^0-9]/g, ''); 
    
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handlePaste = (e) => {
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

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter 6-digit OTP.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await verifyCodeAPI(email, otpString);

      if (result.success) {
        if (setAuthUser && result.data.user) {
          setAuthUser(result.data.user);
        }
        await refreshTeams();
        navigate('/dashboard');
      } else {
        setError(result.message || 'Invalid OTP. Please try again.');
        setOtp(['', '', '', '', '', '']);
        document.getElementById('otp-0')?.focus();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendSuccess(false);
    setError('');

    try {
      const result = await resendCodeAPI(email);
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">We've sent a 6-digit code to</p>
          <p className="text-primary-600 font-medium mt-1 flex items-center justify-center gap-2">
            <FiMail className="h-4 w-4" />
            {email}
          </p>
        </div>

        <div className="card shadow-xl">
          <form onSubmit={handleVerify} className="space-y-6" noValidate>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {resendSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <FiCheckCircle className="h-5 w-5" />
                <span>OTP resent successfully!</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="btn btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                'Verifying..'
              ) : (
                <>
                  <FiCheckCircle className="h-5 w-5" />
                  Verify Email
                </>
              )}
            </button>

            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Didn't receive the code?
              </p>
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || countdown > 0}
                className="text-primary-600 hover:text-primary-700 font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
              >
                <FiRefreshCw className={`h-4 w-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate('/register', { state: { formData: location.state?.formData } })}
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-primary-600 text-sm font-medium"
            >
              <FiArrowLeft className="h-4 w-4" />
              Change Email Address
            </button>
          </div>
        </div>
      </div>
        </div>
      <Footer />
    </div>
  
  );
};

export default VerifyOTP;

