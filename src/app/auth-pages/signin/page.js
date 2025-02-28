'use client'
import { useState, useEffect, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { FcGoogle } from 'react-icons/fc';
import { ToasterProvider } from "@/components/providers/toaster-provider"

function SignInContent() {
    const { data: session } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check for verification success message
        if (searchParams.get('verificationSuccess')) {
            toast.success("Email verified successfully!", {
                description: "Please sign in with your credentials",
                duration: 5000
            });
        }

        // Handle potential errors
        const error = searchParams.get('error');
        if (error) {
            switch (error) {
                case 'invalid_token':
                    toast.error("Invalid verification link", {
                        description: "Please request a new verification email"
                    });
                    break;
                case 'token_not_found':
                    toast.error("Verification link expired", {
                        description: "Please request a new verification email"
                    });
                    break;
                case 'server_error':
                    toast.error("Server error", {
                        description: "Please try again later"
                    });
                    break;
            }
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email: formData.email,
                password: formData.password
            });

            if (result?.error) {
                // Check for verification error
                if (result.error.includes('Please verify your email')) {
                    // Redirect to verification pending page
                    router.push(`/auth-pages/verification-pending?email=${encodeURIComponent(formData.email)}`);
                    return;
                }

                // Handle other errors
                setError(result.error === 'CredentialsSignin'
                    ? 'Invalid email or password'
                    : result.error);
                setLoading(false);
            } else {
                // Successful signin - redirect handled by NextAuth
                router.push('/user-pages/dashboard');
            }
        } catch (error) {
            console.error('Sign in error:', error);
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: formData.email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error);
            }

            toast.success("Verification email sent", {
                description: "Please check your inbox"
            });
        } catch (error) {
            toast.error("Failed to resend verification email", {
                description: error.message
            });
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signIn('google', { callbackUrl: '/user-pages/dashboard' });
        } catch (error) {
            toast.error("Failed to sign in with Google");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Sign In
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your credentials to access your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleSignIn}
                        >
                            <FcGoogle className="mr-2 h-4 w-4" />
                            Continue with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        email: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        password: e.target.value
                                    }))}
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Button>
                        </form>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
                        Don't have an account?{' '}
                        <Link
                            href="/auth-pages/signup"
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            Sign up
                        </Link>
                    </div>
                    <div className="text-sm text-muted-foreground text-center">
                        <button
                            onClick={() => router.push('/auth-pages/forgot-password')}
                            className="text-primary underline-offset-4 hover:underline"
                        >
                            Forgot password?
                        </button>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}

export default function SignIn() {
    return (
        <>
            <ToasterProvider />
            <Suspense fallback={<div>Loading...</div>}>
                <SignInContent />
            </Suspense>
        </>
    );
}
