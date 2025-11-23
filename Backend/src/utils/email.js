import nodemailer from 'nodemailer';

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS in .env');
  }

  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  
  if (smtpHost.includes('@')) {
    console.warn('SMTP_HOST appears to be an email address. Using default smtp.gmail.com');
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: smtpPort,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendOTP = async (email, otp) => {
  try {
    const transporter = createTransporter();

    await transporter.verify();

    let fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    if (fromEmail && !fromEmail.includes('<')) {
      fromEmail = `TeamBoard <${process.env.SMTP_USER}>`;
    }

    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: 'TeamBoard - Email Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">TeamBoard</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #111827; margin-top: 0;">Verify Your Email</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Thank you for registering with TeamBoard! Please use the OTP below to verify your email address.
            </p>
            <div style="background: white; border: 2px dashed #0284c7; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #0284c7; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${otp}
              </div>
            </div>
            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
              This OTP will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>© ${new Date().getFullYear()} TeamBoard. All rights reserved.</p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error.message);
    
    if (error.message.includes('SMTP credentials not configured')) {
      throw new Error('Email service not configured. Please contact administrator.');
    } else if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check SMTP credentials.');
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      throw new Error('Cannot connect to email server. Please check your internet connection.');
    } else {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
};

export const createOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

