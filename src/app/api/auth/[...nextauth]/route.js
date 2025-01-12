// Import necessary modules
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { verifyPassword } from "@/lib/auth";
import supabase from "@/lib/supabaseClient";

// Define auth options
export const authOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    csrf: {
        cookiePrefix: 'next-auth.csrf-token',
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                try {
                    console.log("Attempting authorization..."); // Debug log

                    const { data: user, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', credentials.email)
                        .single();

                    console.log("User query result:", user); // Debug log

                    if (error || !user) {
                        console.log("No user found"); // Debug log
                        throw new Error('No user found with this email');
                    }

                    const isValid = await verifyPassword(
                        credentials.password,
                        user.password
                    );

                    console.log("Password valid:", isValid); // Debug log

                    if (!isValid) {
                        throw new Error('Invalid password');
                    }

                    // Return user object without password
                    return {
                        id: user.id,
                        email: user.email,
                        username: user.username,
                        reading_speed: user.reading_speed // Note: using snake_case
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/auth/signin',
        error: '/auth/error',
        signOut: '/auth/signout'
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.username = user.username;
                token.reading_speed = user.reading_speed;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.username = token.username;
                session.user.reading_speed = token.reading_speed;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET, // Ensure you have a secret set for JWT signing
    adapter: SupabaseAdapter({
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        secret: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        schema: 'public'
    }),
    debug: process.env.NODE_ENV === 'development', // Optional: enable debug messages in development
};

// Export the NextAuth handler
export const GET = NextAuth(authOptions);
export const POST = NextAuth(authOptions);