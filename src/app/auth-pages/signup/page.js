'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { toast } from "sonner";
import { FcGoogle } from 'react-icons/fc';
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
import { Slider } from "@/components/ui/slider";

export default function SignUp() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        confirmPassword: '',
        reading_speed: 0.667 // Updated to pages per minute
    });
    const [loading, setLoading] = useState(false);

    const validatePassword = (password) => {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };

        return {
            isValid: Object.values(requirements).every(Boolean),
            requirements
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // Password validation
        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            setLoading(false);
            return;
        }

        const { isValid, requirements } = validatePassword(formData.password);
        if (!isValid) {
            let errorMessage = "Password must contain:";
            if (!requirements.length) errorMessage += "\n- At least 8 characters";
            if (!requirements.uppercase) errorMessage += "\n- One uppercase letter";
            if (!requirements.lowercase) errorMessage += "\n- One lowercase letter";
            if (!requirements.number) errorMessage += "\n- One number";
            if (!requirements.special) errorMessage += "\n- One special character";

            toast.error("Invalid Password", {
                description: errorMessage
            });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    username: formData.username,
                    reading_speed: formData.reading_speed
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            toast.success("Account created successfully!", {
                description: "Please check your email for verification link"
            });
            router.push('/auth-pages/signin');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            // Using signIn for Google will handle both sign-up and sign-in
            await signIn('google', {
                callbackUrl: '/auth-pages/complete-profile'  // Send new users to settings
            });
        } catch (error) {
            toast.error("Failed to sign up with Google");
        }
    };

    const getReadingSpeedLabel = (value) => {
        if (value <= 0.4) return "Slow";
        if (value <= 0.667) return "Normal";
        if (value <= 0.9) return "Fast";
        return "Very Fast";
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Create an Account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Choose how you'd like to create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={handleGoogleSignUp}
                        >
                            <FcGoogle className="mr-2 h-4 w-4" />
                            Sign up with Google
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or sign up with email
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
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        username: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Create a password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        password: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm your password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        confirmPassword: e.target.value
                                    }))}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reading_speed">
                                    Reading Speed: {formData.reading_speed.toFixed(3)} pages per minute
                                    <span className="ml-2 text-sm text-muted-foreground">
                                        ({getReadingSpeedLabel(formData.reading_speed)})
                                    </span>
                                </Label>
                                <Slider
                                    id="reading_speed"
                                    min={0.2}
                                    max={1.2}
                                    step={0.067}
                                    value={[formData.reading_speed]}
                                    onValueChange={(value) => setFormData(prev => ({
                                        ...prev,
                                        reading_speed: value[0]
                                    }))}
                                    className="w-full"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Slide to adjust your average reading speed
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </Button>
                        </form>
                    </div>

                    <div className="mt-4 text-sm text-muted-foreground text-center">
                        <p>By signing up, you agree to our</p>
                        <div className="space-x-2">
                            <Link href="/terms" className="text-primary hover:underline">
                                Terms of Service
                            </Link>
                            <span>and</span>
                            <Link href="/privacy" className="text-primary hover:underline">
                                Privacy Policy
                            </Link>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        Already have an account?{' '}
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
    );
}