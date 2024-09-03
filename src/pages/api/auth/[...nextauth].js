// src/pages/api/auth/[...nextauth].js
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { connectToMongoose } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import clientPromise from "@/lib/db";
import mongoose from "mongoose";
import MediaItem from "@/models/MediaItem";
import User from "@/models/User";

export const authOptions = {
    session: {
        strategy: "jwt",
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax', // Adjust this as needed
        },
    },
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "text", placeholder: "jsmith@example.com" },
                password: { label: "Password", type: "password" }
            },
            authorize: async (credentials) => {
                await connectToMongoose();
                try {
                    const user = await User.findOne({ email: credentials.email });

                    if (!user) {
                        throw new Error('No user found with the email');
                    }

                    const isValid = await verifyPassword(credentials.password, user.password);

                    if (!isValid) {
                        throw new Error('Password is incorrect');
                    }

                    // Fetch media items for the user
                    const mediaItems = await MediaItem.find({ userId: user._id });

                    return { id: user._id, email: user.email, readingSpeed: user.readingSpeed, username: user.username, mediaItems }; // Include reading speed and media items
                } catch (error) {
                    console.error("Authentication error:", error);
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
        jwt: async ({ token, user }) => {
            if (user) {
                token.id = user.id; // Include user ID in the token
                token.email = user.email;
                token.username = user.username;
                token.readingSpeed = user.readingSpeed; // Include reading speed in the token
                /* token.mediaItems = user.mediaItems; */ // Include media items in the token
            }
            console.log("JWT Callback - Token:", token); // Debug log
            return token;
        },
        session: async ({ session, token }) => {
            session.user.id = token.id;
            session.user.username = token.username; // Include user ID in the session
            session.user.email = token.email;
            session.user.readingSpeed = token.readingSpeed; // Include reading speed in the session
            /* session.user.mediaItems = token.mediaItems; */ // Include media items in the session
            console.log("Session Callback - Session:", session); // Debug log
            return session;
        }
    },
    secret: process.env.NEXTAUTH_SECRET, // Ensure you have a secret set for JWT signing
    adapter: MongoDBAdapter(clientPromise),
    debug: process.env.NODE_ENV === 'development', // Optional: enable debug messages in development
};

export default NextAuth(authOptions);