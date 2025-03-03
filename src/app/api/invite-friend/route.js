import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request) {
    try {
        // Verify user is authenticated
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { email } = await request.json();

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
        }

        // Create email content
        const msg = {
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL || 'noreply@mediaq.io', // Verified sender in SendGrid
            subject: `${session.user.username || session.user.name || 'Your friend'} invites you to join MediaQ`,
            text: `Hello! ${session.user.username || session.user.name || 'Your friend'} thinks you might enjoy using MediaQ to organize your media collections. Visit https://mediaq.io to sign up and start tracking your movies, books, TV shows, and games!`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e9e9e9; border-radius: 5px;">
                    <h2 style="color: #333;">Join MediaQ</h2>
                    <p>Hello!</p>
                    <p><strong>${session.user.username || session.user.name || 'Your friend'}</strong> thinks you might enjoy using MediaQ to organize your media collections.</p>
                    <div style="margin: 25px 0;">
                        <a href="https://mediaq.io" style="background-color: #10B981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Sign Up Now</a>
                    </div>
                    <p>MediaQ helps you:</p>
                    <ul>
                        <li>Track movies, TV shows, books and games</li>
                        <li>Organize your media in one place</li>
                        <li>Connect with friends and share recommendations</li>
                    </ul>
                    <p style="margin-top: 30px; font-size: 0.8rem; color: #666;">If you received this email by mistake, you can simply ignore it.</p>
                </div>
            `,
        };

        // Send email
        await sgMail.send(msg);

        // Log invitation for future reference
        console.log(`Invitation sent from ${session.user.email} to ${email}`);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending invitation:', error);
        return NextResponse.json(
            { error: 'Failed to send invitation' },
            { status: 500 }
        );
    }
} 