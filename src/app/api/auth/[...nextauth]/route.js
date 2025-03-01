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
        signIn: '/auth-pages/signin',
        error: '/auth-pages/error',
        signOut: '/auth/signout'
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account.provider === "google") {
                try {
                    // Check if user already exists
                    const { data: existingUser } = await supabase
                        .from('users')
                        .select('*')
                        .eq('email', user.email)
                        .single();

                    if (!existingUser) {
                        // Create new user with Google data
                        const { data: newUser, error: createError } = await supabase
                            .from('users')
                            .insert([
                                {
                                    email: user.email,
                                    username: user.name,
                                    first_name: user.given_name,
                                    last_name: user.family_name,
                                    is_verified: true,
                                    reading_speed: null,
                                    google_id: user.id,
                                    password: null  // Explicitly set to null for Google users
                                }
                            ])
                            .select()
                            .single();

                        if (createError) {
                            console.error("Error creating user:", createError);
                            return false;
                        }
                        // Set the user ID from the newly created user
                        user.id = newUser.id;
                    } else {
                        // Set the user ID from the existing user
                        user.id = existingUser.id;
                        user.reading_speed = existingUser.reading_speed;
                    }
                    return true;
                } catch (error) {
                    console.error("Google sign in error:", error);
                    return false;
                }
            }
            return true;
        },
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.username = user.name;
                token.reading_speed = user.reading_speed;
            }

            if (account?.provider === "google") {
                // Check if this is a new Google user by querying the database
                const { data: userData } = await supabase
                    .from('users')
                    .select('reading_speed, google_id')
                    .eq('email', token.email)
                    .single();

                // Set isNewUser flag if the user doesn't have a reading_speed
                token.isNewUser = !userData?.reading_speed;
                token.google_id = userData?.google_id;
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.email = token.email;
                session.user.username = token.username;
                session.user.isNewUser = token.isNewUser;
                session.user.reading_speed = token.reading_speed;
            }
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };