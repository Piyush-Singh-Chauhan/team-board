import bcrypt from 'bcrypt';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { createToken } from '../utils/jwt.js';
import { sendOTP, createOTP } from '../utils/email.js';

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'email already exists',
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const otp = createOTP();

    await OTP.deleteMany({ email: email.toLowerCase() });

    await OTP.create({
      email: email.toLowerCase().trim(),
      otp,
      userData: {
        name: name.trim(),
        passwordHash,
      },
    });

    try {
      await sendOTP(email.toLowerCase().trim(), otp);
    } catch (emailError) {
      console.error('failed to send:', emailError.message);
      await OTP.deleteMany({ email: email.toLowerCase() });
      res.status(500).json({
        success: false,
        message: emailError.message || 'Failed to send otp.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent. Please verify to complete registration.',
      data: {
        email: email.toLowerCase().trim(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyCode = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      await OTP.deleteMany({ email: email.toLowerCase() });
      res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
      return;
    }

    const user = await User.create({
      name: otpRecord.userData.name,
      email: email.toLowerCase().trim(),
      passwordHash: otpRecord.userData.passwordHash,
    });

    otpRecord.verified = true;
    await otpRecord.save();

    await OTP.deleteMany({ email: email.toLowerCase() });

    const token = createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    res.status(201).json({
      success: true,
      message: 'Email verified.',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendCode = async (req, res, next) => {
  try {
    const { email } = req.body;

    const existingOTP = await OTP.findOne({
      email: email.toLowerCase().trim(),
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!existingOTP) {
      res.status(400).json({
        success: false,
        message: 'No pending registration found for this email. Please register again.',
      });
      return;
    }

    const otp = createOTP();

    existingOTP.otp = otp;
    existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await existingOTP.save();

    try {
      await sendOTP(email.toLowerCase().trim(), otp);
    } catch (emailError) {
      res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please try again.',
      });
      return;
    }

    res.json({
      success: true,
      message: 'OTP resent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'invalid email or password',
      });
      return;
    }

    const token = createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User with this email does not exist',
      });
      return;
    }

    const otp = createOTP();

    await OTP.deleteMany({ email: email.toLowerCase() });

    await OTP.create({
      email: email.toLowerCase().trim(),
      otp,
      userData: {
        name: user.name,
        passwordHash: user.passwordHash,
      },
    });

    try {
      await sendOTP(email.toLowerCase().trim(), otp);
    } catch (emailError) {
      console.error('Failed to send OTP:', emailError.message);
      await OTP.deleteMany({ email: email.toLowerCase() });
      res.status(500).json({
        success: false,
        message: emailError.message || 'Failed to send OTP.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email. Please check your inbox.',
      data: {
        email: email.toLowerCase().trim(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User with this email does not exist',
      });
      return;
    }

    const existingOTP = await OTP.findOne({
      email: email.toLowerCase().trim(),
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!existingOTP) {
      res.status(400).json({
        success: false,
        message: 'No pending OTP found. Please request a new OTP.',
      });
      return;
    }

    const otp = createOTP();

    existingOTP.otp = otp;
    existingOTP.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await existingOTP.save();

    try {
      await sendOTP(email.toLowerCase().trim(), otp);
    } catch (emailError) {
      console.error('Failed to send OTP:', emailError.message);
      res.status(500).json({
        success: false,
        message: emailError.message || 'Failed to send OTP.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP resent to your email.',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyForgotPasswordOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const otpRecord = await OTP.findOne({
      email: email.toLowerCase().trim(),
      otp,
      expiresAt: { $gt: new Date() },
      verified: false,
    });

    if (!otpRecord) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP',
      });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    user.passwordHash = passwordHash;
    await user.save();

    otpRecord.verified = true;
    await otpRecord.save();

    await OTP.deleteMany({ email: email.toLowerCase() });

    res.status(200).json({
      success: true,
      message: 'Password reset successful. Please login with your new password.',
    });
  } catch (error) {
    next(error);
  }
};
