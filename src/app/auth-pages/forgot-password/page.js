'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from "sonner";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToasterProvider } from "@/components/providers/toaster-provider"; // Ensure you have this provider

export default function ForgotPassword() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Even if the response isn't "ok" from the server's perspective (e.g., internal error),
                // we show a generic success message to the user for security.
                // The specific error is logged server-side in the API route.
                toast.info("If an account with that email exists, a password reset link has been sent.", {
                    description: "Please check your inbox (and spam folder).",
                    duration: 6000
                });
            } else {
                // Show the success message from the API (which is generic)
                toast.info(data.message || "If an account with that email exists, a password reset link has been sent.", {
                    description: "Please check your inbox (and spam folder).",
                    duration: 6000
                });
            }
            // Optionally redirect or clear the form
            // router.push('/auth-pages/signin'); // Or stay on the page

        } catch (error) {
            console.error("Forgot Password client error:", error);
            // Show a generic message even on client-side fetch errors
            toast.info("If an account with that email exists, a password reset link has been sent.", {
                description: "Please check your inbox (and spam folder).",
                duration: 6000
            });
        } finally {
            setLoading(false);
            setEmail(''); // Clear email field after submission
        }
    };

    return (
        <>
            <ToasterProvider />
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Forgot Password?
                        </CardTitle>
                        <CardDescription className="text-center">
                            Enter your email address below and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <div className="text-sm text-muted-foreground">
                            Remembered your password?{' '}
                            <Link
                                href="/auth-pages/signin"
                                className="text-primary underline-offset-4 hover:underline"
                            >
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </>
    );
} 