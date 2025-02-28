'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, CheckCircle } from 'lucide-react';
import { toast } from "sonner";

// Create a separate component that uses useSearchParams
function VerificationContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);

    const handleResendVerification = async () => {
        setIsResending(true);

        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setResendSuccess(true);
                toast.success("Verification Email Sent", {
                    description: "We've sent you another verification email. Please check your inbox."
                });
            } else {
                throw new Error(data.message || 'Failed to resend verification email');
            }
        } catch (error) {
            toast.error("Error", {
                description: error.message || "Something went wrong. Please try again."
            });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1">
                <div className="flex justify-center mb-4">
                    <Mail className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl text-center">Check Your Email</CardTitle>
                <CardDescription className="text-center">
                    We've sent a verification link to:
                </CardDescription>
                <div className="px-6 py-2 bg-secondary/30 rounded-md text-center font-medium">
                    {email}
                </div>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
                <p>
                    Please check your email and click the verification link to complete your registration.
                </p>
                <p className="text-sm text-muted-foreground">
                    If you don't see the email, check your spam folder or request a new verification link.
                </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
                {resendSuccess ? (
                    <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span>Verification email resent!</span>
                    </div>
                ) : (
                    <Button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="w-full"
                    >
                        {isResending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Resend Verification Email"
                        )}
                    </Button>
                )}
                <Button variant="outline" className="w-full" onClick={() => window.location.href = '/auth-pages/signin'}>
                    Back to Sign In
                </Button>
            </CardFooter>
        </Card>
    );
}

// Main component with Suspense wrapper
export default function VerificationPending() {
    return (
        <div className="flex justify-center items-center min-h-[80vh] px-4">
            <Suspense fallback={
                <Card className="w-full max-w-md shadow-lg p-8 text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Loading verification details...</p>
                </Card>
            }>
                <VerificationContent />
            </Suspense>
        </div>
    );
} 