import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send an email verification link
 * @param {string} to - Recipient email address
 * @param {string} token - Verification token
 * @returns {Promise} - Resend response
 */
export async function sendVerificationEmail(to, token) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify/${token}`;

  return resend.emails.send({
    from: 'MediaQ <wayne@mediaq.io>',
    to,
    subject: 'Verify your MediaQ account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to MediaQ!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>If the button doesn't work, you can also click on this link or copy it to your browser:</p>
        <p><a href="${verificationLink}">${verificationLink}</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't sign up for MediaQ, you can safely ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Send a welcome email after successful verification
 * @param {string} to - Recipient email address
 * @param {string} username - User's name or username
 * @returns {Promise} - Resend response
 */
export async function sendWelcomeEmail(to, username) {
  const signinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin`;

  return resend.emails.send({
    from: 'MediaQ <wayne@mediaq.io>',
    to,
    subject: 'Welcome to MediaQ!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to MediaQ!</h2>
        <p>Hi ${username || 'there'}!</p>
        <p>Your email has been successfully verified. You're now ready to start using MediaQ!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${signinUrl}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Sign In to Your Account
          </a>
        </div>
        <p>Thanks for joining us!</p>
        <p>The MediaQ Team</p>
      </div>
    `,
  });
}

/**
 * Send a password reset link
 * @param {string} to - Recipient email address
 * @param {string} token - Password reset token
 * @returns {Promise} - Resend response
 */
export async function sendPasswordResetEmail(to, token) {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/reset-password/${token}`;

  return resend.emails.send({
    from: 'MediaQ <wayne@mediaq.io>',
    to,
    subject: 'Reset your MediaQ password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your MediaQ Password</h2>
        <p>We received a request to reset the password for your MediaQ account associated with this email address.</p>
        <p>Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" 
             style="background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, you can also click on this link or copy it to your browser:</p>
        <p><a href="${resetLink}">${resetLink}</a></p>
        <p>This link is valid for 1 hour. If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        <p>Thanks,</p>
        <p>The MediaQ Team</p>
      </div>
    `,
  });
}

/**
 * Send a thank you email to new users
 * @param {string} to - Recipient email address
 * @returns {Promise} - Resend response
 */
export async function sendThankYouEmail(to) {
  const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/unsubscribe?email=${encodeURIComponent(to)}`;

  return resend.emails.send({
    from: 'MediaQ <wayne@mediaq.io>',
    to,
    subject: 'Thank You for Joining MediaQ!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank You for Joining MediaQ!</h2>
        
        <p>Hey, thanks for checking out MediaQ! Just thought I'd reach out and let you know about some updates that have happened since 3/27 (After the Tech For Culture Meetup).</p>
        
        <p>I modified the movie and TV streaming service feature to better display platform availability on queue items as well as search results. I added dynamic external links like GoodReads for books as well to the search results. This way, users no longer have to add items to their queue to simply check availability. Some UI flow fixes as well.</p>
        
        <p><strong>New Features In Development:</strong></p>
        <ul style="margin-bottom: 20px;">
          <li>Queue Randomizer</li>
          <li>User notes for queue items</li>
          <li>"Clubs" (which are just user-made groups)</li>
          <li>Custom Ad and Affiliate Link Switchboard (for premium users)</li>
          <li>News Feed (with recommendations based on user queue as well as friend and Club activity)</li>
          <li>Achievement/Trophy System</li>
        </ul>
        

              <img src="https://6zm8wdn7u7.ufs.sh/f/wciQHFXot4VkniEicTLagT9lAUoBuYFZehqptW8DsSxGvXM0" 
           alt="MediaQ Image" 
           style="max-width: 200px; height: auto;" />
    </div>
        
        <p>To unsubscribe from future emails (no hard feelings), please click the link below:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${unsubscribeLink}" 
             style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Unsubscribe
          </a>
        </div>
      </div>
    `,
  });
}
