import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
    try {
        const { name, email, subject, message } = await request.json();

        // Basic validation
        if (!name || !email || !subject || !message) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Send email using Resend
        await resend.emails.send({
            from: 'MediaQ Contact <wayne@mediaq.io>',
            to: 'wayne@mediaq.io',
            replyTo: email,
            subject: `MediaQ Contact: ${subject}`,
            html: `
        <h1>New contact form submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
        });

        return NextResponse.json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Contact form error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 