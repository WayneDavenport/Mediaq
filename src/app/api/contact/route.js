import { NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

        // Format the email
        const msg = {
            to: 'wayne@mediaq.io',
            from: process.env.SENDGRID_FROM_EMAIL || 'contact@mediaq.io', // Use your verified sender
            subject: `MediaQ Contact: ${subject}`,
            text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage: ${message}`,
            html: `
        <h1>New contact form submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
        };

        // Send email using SendGrid
        await sgMail.send(msg);

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