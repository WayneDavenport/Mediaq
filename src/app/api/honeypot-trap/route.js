import { NextResponse } from 'next/server'
// Removed: import { ipAddress } from '@vercel/edge'
// Import your existing Supabase client
import supabase from '@/lib/supabaseClient'

// Helper function to extract IP address from headers
function getClientIp(request) {
    let ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
    if (ip) return ip;

    ip = request.headers.get('x-real-ip')?.trim();
    if (ip) return ip;

    // Fallback for direct connections (less common behind proxies like Vercel)
    // Note: `request.ip` is available in Edge runtime, but we are aiming for Node runtime compatibility here.
    // Accessing socket directly might not be reliable or available in all environments.
    // Returning null if IP cannot be determined from standard headers.
    return null;
}

// This function will handle GET requests to /api/honeypot-trap
export async function GET(request) {
    // Get the client's IP address using the helper function
    const clientIp = getClientIp(request);

    if (!clientIp) {
        console.warn('Honeypot: Could not determine client IP address from headers.');
        // Still return Forbidden, even if we can't log the IP
        return new NextResponse('Forbidden', { status: 403 });
    }

    console.log(`Honeypot triggered by IP: ${clientIp}. Attempting to log to Supabase.`);

    try {
        // Insert the IP address into the Supabase table
        const { data, error } = await supabase
            .from('blocked_ips')
            .insert([{ ip_address: clientIp }])
            .select();

        if (error) {
            console.error(`Honeypot: Failed to log IP ${clientIp} to Supabase. Error:`, error);
            return new NextResponse('Forbidden', { status: 403 });
        } else {
            console.log(`Honeypot: Successfully logged IP: ${clientIp} to Supabase.`, data);
        }

    } catch (error) {
        console.error(`Honeypot: Unexpected error logging IP ${clientIp} to Supabase:`, error);
        return new NextResponse('Forbidden', { status: 403 });
    }

    // Always return a 403 Forbidden response to the bot
    return new NextResponse('Forbidden', { status: 403 });
}

// ... (POST handler remains the same)
export async function POST(request) {
    return new NextResponse('Method Not Allowed', { status: 405 });
} 