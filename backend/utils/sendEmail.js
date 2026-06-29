/**
 * Sends transaction/notification emails using Resend HTTP API.
 * This is the production-ready industry standard for cloud deployments (like Render)
 * as standard SMTP ports (25, 465, 587) are blocked on free cloud instances.
 */
const sendEmail = async (options) => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'CampusFind <onboarding@resend.dev>';

  if (!resendApiKey) {
    console.error('❌ [EMAIL ERROR] RESEND_API_KEY is not set in environment variables.');
    return false;
  }

  try {
    // Parse single email address or comma-separated lists
    const toEmails = options.email.split(',').map(e => e.trim()).filter(Boolean);

    console.log(`📧 [RESEND] Sending email to: ${toEmails.join(', ')}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: emailFrom,
        to: toEmails,
        reply_to: options.replyTo,
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
              Hello ${options.name || 'User'},<br><br>
              Thank you for registering at CampusFind! To complete your profile setup and start reporting/finding items on campus, please verify your college email address by clicking the link below:
            </p>
            
            <div style="text-align: center; margin-bottom: 28px;">
              <a href="${options.verifyUrl}" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 10px rgba(99,102,241,0.25);">Verify Email Address</a>
            </div>
            
            <hr style="border: 0; border-top: 1px solid #efefef; margin: 24px 0;">
            
            <div style="text-align: center; font-size: 11px; color: #aaaaaa; line-height: 1.4;">
              This email was sent for verification.<br>
              If you did not register for a CampusFind account, you can safely ignore this email.
            </div>
          </div>
        `
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `Resend API returned status ${response.status}`);
    }

    console.log(`✅ [RESEND] Email sent successfully. ID: ${data.id}`);
    return true;
  } catch (error) {
    console.error(`❌ [RESEND ERROR] Failed to send email:`, error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
};

module.exports = sendEmail;
