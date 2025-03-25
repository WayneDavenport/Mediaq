import { sendThankYouEmail } from '@/lib/sendGrid';

export async function POST(req) {
    const { email } = await req.json();

    try {
        await sendThankYouEmail(email);
        return new Response(JSON.stringify({ message: 'Email sent successfully' }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ message: 'Failed to send email' }), { status: 500 });
    }
}
