'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ToasterProvider } from "@/components/providers/toaster-provider";

function ResetPasswordContent() {
    const router = useRouter();
    const params = useParams();
    const [token, setToken] = useState('');
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // General error message
    const [passwordError, setPasswordError] = useState(null); // Specific password validation error

    // Extract token from URL params once component mounts
    useEffect(() => {
        if (params?.token) {
            setToken(params.token);
        } else {
            toast.error("Invalid or missing reset link.", {
                description: "Please request a new password reset link.",
                duration: 6000
            });
            // Consider redirecting if token is definitively missing
            // router.push('/auth-pages/forgot-password');
        }
    }, [params, router]);

    const validatePassword = (password) => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        const isValid = Object.values(requirements).every(Boolean);
        let errorMessage = "";
        if (!isValid) {
            errorMessage = "Password must contain:";
            if (!requirements.length) errorMessage += "\n- At least 8 characters";
            if (!requirements.uppercase) errorMessage += "\n- One uppercase letter";
            if (!requirements.lowercase) errorMessage += "\n- One lowercase letter";
            if (!requirements.number) errorMessage += "\n- One number";
            if (!requirements.special) errorMessage += "\n- One special character";
        }
        return { isValid, errorMessage };
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null); // Clear previous errors
        setPasswordError(null); // Clear password validation error

        if (!token) {
            toast.error("Missing reset token. Cannot proceed.");
            return;
        }

        // Basic frontend password match check
        if (formData.password !== formData.confirmPassword) {
            setPasswordError("Passwords do not match.");
            toast.error("Passwords do not match.");
            return;
        }

        // Frontend password complexity validation
        const { isValid, errorMessage } = validatePassword(formData.password);
        if (!isValid) {
            setPasswordError(errorMessage);
            toast.error("Invalid Password", { description: errorMessage });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', { // Target the new API route
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token, // Send the token from the URL
                    password: formData.password, // Send the new password
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle specific errors from the backend if available
                if (data.error === 'Invalid or expired token') {
                    toast.error("Invalid or Expired Link", {
                        description: "Your password reset link is invalid or has expired. Please request a new one."
                    });
                    // Optionally redirect to forgot password page
                    // router.push('/auth-pages/forgot-password');
                } else if (data.error === 'Password validation failed') {
                    // Although validated on frontend, backend might have stricter rules or catch edge cases
                    toast.error("Invalid Password", { description: data.message || "Password does not meet requirements." });
                }
                else {
                    toast.error("Failed to Reset Password", {
                        description: data.message || "An error occurred. Please try again."
                    });
                }
                setError(data.message || 'Failed to reset password.'); // Set general error state if needed

            } else {
                // Success!
                toast.success("Password Reset Successfully!", {
                    description: "You can now sign in with your new password."
                });
                // Redirect to the sign-in page after a short delay
                setTimeout(() => {
                    router.push('/auth-pages/signin');
                }, 2000);
            }
        } catch (error) {
            console.error("Reset Password client error:", error);
            toast.error("An unexpected error occurred.", {
                description: "Please try again later."
            });
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    if (!token && !params?.token) {
        // Optionally show a loading state or message while waiting for token
        return (
            <div className="flex items-center justify-center min-h-screen bg-background p-4">
                <p>Loading...</p>
            </div>
        );
    }


    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Reset Your Password
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter and confirm your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your new password"
                                required
                                value={formData.password}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, password: e.target.value }));
                                    setPasswordError(null); // Clear error on change
                                    setError(null);
                                }}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Confirm your new password"
                                required
                                value={formData.confirmPassword}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
                                    setPasswordError(null); // Clear error on change
                                    setError(null);
                                }}
                                disabled={loading}
                            />
                            {passwordError && <p className="text-sm text-red-600 whitespace-pre-line">{passwordError}</p>}
                        </div>

                        {/* Display general error messages if needed */}
                        {error && !passwordError && <p className="text-sm text-red-600">{error}</p>}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading || !token} // Disable if loading or token is missing
                        >
                            {loading ? 'Resetting Password...' : 'Set New Password'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        <Link
                            href="/auth-pages/signin"
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            Back to Sign in
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}


// Use Suspense for cleaner handling of client components using hooks like useParams
export default function ResetPasswordPage() {
    return (
        <>
            <ToasterProvider />
            <Suspense fallback={<div>Loading...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </>
    );
} 