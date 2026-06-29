const nodemailer = require('nodemailer');

/**
 * Sends a real email using Nodemailer with Gmail.
 * Falls back gracefully to logging to terminal if credentials are not set.
 */
const sendEmail = async (options) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.log('⚠️ [EMAIL NOT CONFIG] EMAIL_USER or EMAIL_PASS not set in .env. Real email skipped.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"CampusFind NITKKR" <${emailUser}>`,
      to: options.email,
      replyTo: options.replyTo,
      subject: options.subject,
      text: options.text,
      html: options.html || `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; color: #333333;">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #efefef; padding-bottom: 16px;">
            <span style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: -1px;">🔍 CampusFind</span>
            <div style="font-size: 11px; text-transform: uppercase; color: #999; margin-top: 4px; letter-spacing: 1px;">NIT Kurukshetra Lost & Found</div>
          </div>
          
          <h2 style="font-size: 20px; font-weight: 700; color: #1e1f29; margin-bottom: 16px;">Verify your Email Address</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #555555; margin-bottom: 24px;">
            Hello ${options.name},<br><br>
            Thank you for registering at CampusFind! To complete your profile setup and start reporting/finding items on campus, please verify your college email address by clicking the link below:
          </p>
          
          <div style="text-align: center; margin-bottom: 28px;">
            <a href="${options.verifyUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(99,102,241,0.25);">Verify Email Address</a>
          </div>
          
          <p style="font-size: 12px; line-height: 1.5; color: #888888; margin-bottom: 20px;">
            If the button above does not work, copy and paste the link below into your web browser:<br>
            <a href="${options.verifyUrl}" style="color: #6366f1; word-break: break-all;">${options.verifyUrl}</a>
          </p>
          
          <hr style="border: 0; border-top: 1px solid #efefef; margin: 24px 0;">
          
          <div style="text-align: center; font-size: 11px; color: #aaaaaa; line-height: 1.4;">
            This email was sent to ${options.email} for verification.<br>
            If you did not register for a CampusFind account, you can safely ignore this email.
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 [REAL MAIL] Email sent successfully to ${options.email}. Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Failed to send real email to ${options.email}:`, error.message);
    throw new Error('Email could not be sent. Please check email configuration or try again later.');
  }
};

module.exports = sendEmail;
