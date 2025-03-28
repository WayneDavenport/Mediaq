import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email verification link
 * @param {string} to - Recipient email address
 * @param {string} token - Verification token
 * @returns {Promise} - SendGrid response
 */
export async function sendVerificationEmail(to, token) {
  const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify/${token}`;

  const msg = {
    to,
    from: 'wayne@mediaq.io', // Your verified sender
    subject: 'Verify your MediaQ account',
    text: `Welcome to MediaQ! Please verify your email by clicking this link: ${verificationLink}`,
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
  };

  return sgMail.send(msg);
}

/**
 * Send a welcome email after successful verification
 * @param {string} to - Recipient email address
 * @param {string} username - User's name or username
 * @returns {Promise} - SendGrid response
 */
export async function sendWelcomeEmail(to, username) {
  const signinUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth-pages/signin`;

  const msg = {
    to,
    from: 'wayne@mediaq.io', // Your verified sender
    subject: 'Welcome to MediaQ!',
    text: `Hi ${username || 'there'}! Your email has been verified. You can now sign in to MediaQ and start using all our features.`,
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
  };

  return sgMail.send(msg);
}

export async function sendThankYouEmail(to) {
  const unsubscribeLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/admin/unsubscribe?email=${encodeURIComponent(to)}`;

  const msg = {
    to,
    from: 'wayne@mediaq.io',
    subject: 'Thank You for Joining MediaQ!',
    text: `Hey, thanks for checking out MediaQ! I've fixed a few bugs snce you joined, mainly one where user reading speeds weren't getting saved upon account creation. I added the default reading speed to your profile. This can be changed in user settings. I'll be making steady improvements and adding new features for the foreseeable future. But feel free to reach out to me if you have any questions or feedback here or on the app contact page. In the mean time, I encourage you to try out it's current features and see if it provides any value or fun. To unsubscribe from the app and emails click here: ${unsubscribeLink}`,
    html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">Thank You for Joining MediaQ!</h2>
                <p>Hey, thanks for checking out MediaQ! I've fixed a few bugs snce you joined, mainly one where user reading speeds weren't getting saved upon account creation. I added the default reading speed to your profile. This can be changed in user settings. I'll be making steady improvements and adding new features for the foreseeable future. But feel free to reach out to me if you have any questions or feedback here or on the app contact page. In the mean time, I encourage you to try out it's current features and see if it provides any value or fun. 
                <p>We appreciate your interest in MediaQ. If you wish to unsubscribe from future emails, please click the link below:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${unsubscribeLink}" 
                       style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                        Unsubscribe
                    </a>
                </div>
            </div>
        `,
  };

  return sgMail.send(msg);
} 