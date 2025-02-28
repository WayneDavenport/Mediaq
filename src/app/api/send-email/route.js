// Route handler for sending emails with SendGrid
import { NextResponse } from 'next/server';
const sgMail = require('@sendgrid/mail');

export async function POST() {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
        to: 'wayne86davenport@gmail.com', // Change to your recipient
        from: 'wayne@mediaq.io', // Change to your verified sender
        subject: 'Sending with SendGrid is Fun',
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };

    try {
        await sgMail.send(msg);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
} 