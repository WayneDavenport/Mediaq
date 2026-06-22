// Route handler for sending emails with Resend
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST() {
    const msg = {
        from: 'MediaQ <wayne@mediaq.io>',
        to: 'wayne86davenport@gmail.com',
        subject: 'Sending with Resend is Fun',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    try {
        await resend.emails.send(msg);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 