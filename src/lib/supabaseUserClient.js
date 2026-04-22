import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

function base64url(value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return Buffer.from(str)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function signSupabaseToken(userId, userEmail) {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url({ alg: 'HS256', typ: 'JWT' });
    const payload = base64url({
        sub: userId,
        email: userEmail,
        role: 'authenticated',
        aud: 'authenticated',
        iat: now,
        exp: now + 3600,
    });
    const signingInput = `${header}.${payload}`;
    const secret = process.env.SUPABASE_JWT_SECRET;
    const signature = createHmac('sha256', secret)
        .update(signingInput)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    return `${signingInput}.${signature}`;
}

/**
 * Creates a user-scoped Supabase client whose queries are constrained by RLS.
 *
 * Use this instead of the service-role client whenever the operation belongs
 * to a specific user and should respect row-level security policies.
 * Keep using the service-role client (supabaseClient.js) for:
 *   - Admin routes
 *   - Cross-user writes (e.g. creating a notification for another user)
 *   - Any operation that legitimately needs to bypass RLS
 *
 * @param {string} userId    - session.user.id from getServerSession
 * @param {string} userEmail - session.user.email from getServerSession
 */
export function createUserSupabaseClient(userId, userEmail) {
    const token = signSupabaseToken(userId, userEmail);

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            global: {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            },
            auth: {
                persistSession: false,
            },
        }
    );
}
