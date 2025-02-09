import nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',  // or custom SMTP
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD // Use App Password for Gmail
    },
    tls: {
        rejectUnauthorized: false // Only use this in development if needed
    }
});

// Test the configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log('SMTP config error:', error);
    } else {
        console.log('SMTP server is ready to take our messages');
    }
});

export async function sendVerificationEmail(userEmail, verificationToken) {
    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userEmail,
            subject: 'Verify your MediaQ account',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #333;">Welcome to MediaQ!</h1>
                    <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify/${verificationToken}"
                       style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                    <p style="color: #666; margin-top: 20px;">
                        If you didn't create an account, you can safely ignore this email.
                    </p>
                </div>
            `
        });

        console.log('Verification email sent:', info.messageId);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        throw error;
    }
} 