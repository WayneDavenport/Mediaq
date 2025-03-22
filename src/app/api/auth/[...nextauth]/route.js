// Import necessary modules
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
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
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
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

                    if (!user.is_verified) {
                        throw new Error('Please verify your email before signing in');
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
                        reading_speed: user.reading_speed, // Note: using snake_case
                        is_admin: user.is_admin || false // Include admin status
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    return null;
                }
            }
        })
    ],
    pages: {
        signIn: '/auth-pages/signin',
        error: '/auth-pages/error',
        signOut: '/auth/signout'
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            // For email/password login, check if the user is verified
            if (account.provider === 'credentials') {
                const { data: userData, error } = await supabase
                    .from('users')
                    .select('is_verified')
                    .eq('email', user.email)
                    .single();

                if (error) {
                    console.error('Error checking user verification status:', error);
                    return false;
                }

                if (!userData.is_verified) {
                    throw new Error('Please verify your email before signing in');
                }
            }

            console.log("SignIn callback triggered with provider:", account?.provider);
            /*  console.log("User data:", user); */

            if (account?.provider === "google") {
                try {
                    console.log("Google auth flow - checking if user exists");
                    // Check if user already exists
                    const { data: existingUser, error: queryError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single();

                    if (queryError && queryError.code !== 'PGRST116') {
                        // PGRST116 is "no rows returned" which is expected for new users
                        console.error("Error querying existing user:", queryError);
                        return '/auth-pages/error?error=DatabaseError';
                    }

                    console.log("Existing user check result:", existingUser);

                    if (!existingUser) {
                        console.log("Creating new user with Google data");
                        // Create new user with Google data
                        const { data: newUser, error: createError } = await supabase
                            .from('users')
                            .insert([
                                {
                                    email: user.email,
                                    username: user.name || `user_${Date.now().toString(36)}`, // Ensure unique username
                                    first_name: user.given_name || '',
                                    last_name: user.family_name || '',
                                    is_verified: true,
                                    reading_speed: null,
                                    google_id: user.id,
                                    password: null,
                                    avatar_url: user.image,
                                    is_admin: false // New users are not admins by default
                                }
                            ])
                            .select()
                            .single();

                        if (createError) {
                            console.error("Error creating user:", createError);
                            // Check if it's a unique constraint violation (username might already exist)
                            if (createError.code === '23505') {
                                return '/auth-pages/error?error=UsernameExists';
                            }
                            return false;
                        }
                        console.log("New user created:", newUser);
                        // Set the user ID from the newly created user
                        user.id = newUser.id;
                        user.is_admin = newUser.is_admin || false;
                    } else {
                        console.log("Using existing user data");
                        // Set the user ID from the existing user
                        user.id = existingUser.id;
                        user.reading_speed = existingUser.reading_speed;
                        user.is_admin = existingUser.is_admin || false;
                    }
                    return true;
                } catch (error) {
                    console.error("Google sign in error:", error);
                    return false;
                }
            }
            return true;
        },
        async session({ session, token }) {
            // Log the session and token for debugging
            console.log('Session Callback:', {
                sessionExists: !!session,
                tokenExists: !!token,
                tokenSub: token?.sub,
                tokenEmail: token?.email
            });

            if (token) {
                session.user.id = token.sub || token.id; // Try both sub and id
                session.user.email = token.email;
                session.user.username = token.username;
                session.user.isNewUser = token.isNewUser;
                session.user.reading_speed = token.reading_speed;
                session.user.isAdmin = token.is_admin || false;
            }

            // Log the final session
            console.log('Final Session:', {
                userId: session?.user?.id,
                userEmail: session?.user?.email
            });

            return session;
        },
        async jwt({ token, user, account }) {
            // Log the JWT creation
            console.log('JWT Callback:', {
                userExists: !!user,
                accountExists: !!account,
                tokenSub: token?.sub
            });

            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.username = user.name;
                token.reading_speed = user.reading_speed;
                token.is_admin = user.is_admin || false;
            }

            if (account?.provider === "google") {
                // Check if this is a new Google user by querying the database
                const { data: userData } = await supabase
                    .from('users')
                    .select('reading_speed, google_id, is_admin')
                    .eq('email', token.email)
                    .single();

                // Set isNewUser flag if the user doesn't have a reading_speed
                token.isNewUser = !userData?.reading_speed;
                token.google_id = userData?.google_id;
                token.is_admin = userData?.is_admin || false;
            }

            return token;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
    cookies: {
        sessionToken: {
            name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
            options: {
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                secure: process.env.NODE_ENV === 'production'
            }
        }
    }
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };