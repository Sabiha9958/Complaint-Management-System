/**
 * ================================================================
 * 📧 EMAIL SERVICE
 * ================================================================
 * Handles sending emails using Nodemailer
 * ================================================================
 */

const nodemailer = require("nodemailer");

// Create transporter
const createTransporter = () => {
  // For development, use Ethereal (fake SMTP)
  // For production, use real SMTP (Gmail, SendGrid, etc.)

  if (process.env.NODE_ENV === "production") {
    // Production: Use real email service
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Development: Use Gmail or Ethereal
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your gmail
        pass: process.env.EMAIL_PASSWORD, // app password
      },
    });
  }
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, resetToken) => {
  const transporter = createTransporter();

  // Reset URL (frontend)
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `ComplaintMS <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Request - ComplaintMS",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 15px 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name}</strong>,</p>
              
              <p>You requested to reset your password for your ComplaintMS account.</p>
              
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p><strong>⏰ This link will expire in 10 minutes.</strong></p>
              
              <p>If the button doesn't work, copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
              
              <p style="color: #666; font-size: 14px;">
                <strong>⚠️ Didn't request this?</strong><br>
                If you didn't request a password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ComplaintMS. All rights reserved.</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

/**
 * Send password reset confirmation email
 */
const sendPasswordResetConfirmation = async (user) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `ComplaintMS <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to: user.email,
    subject: "Password Reset Successful - ComplaintMS",
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #10b981;">✅ Password Reset Successful</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your password has been successfully reset.</p>
            <p>If you did not make this change, please contact support immediately.</p>
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} ComplaintMS</p>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
};
