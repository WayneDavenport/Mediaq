export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    // Here you can handle the unsubscribe logic, such as updating your database
    // For now, we'll just log the email and send a response

    console.log(`Unsubscribe request for email: ${email}`);

    // Send a simple response
    return new Response('You have been unsubscribed.', { status: 200 });
}
