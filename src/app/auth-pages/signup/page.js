'use client'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SignUp() {
    const { data: session } = useSession();
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        reading_speed: '20'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (session) {
            router.push('/dashboard');
        }
    }, [session, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create account');
            }

            router.push('/auth-pages/signin?success=Account created successfully');

        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">
                        Create an account
                    </CardTitle>
                    <CardDescription className="text-center">
                        Enter your details below to create your account
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
                                placeholder="Your username"
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
                                placeholder="Enter your password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    password: e.target.value
                                }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="reading_speed">Reading Speed</Label>
                            <Select
                                value={formData.reading_speed}
                                onValueChange={(value) => setFormData(prev => ({
                                    ...prev,
                                    reading_speed: value
                                }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select your reading speed" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="20">Slow (20 wpm)</SelectItem>
                                    <SelectItem value="40">Normal (40 wpm)</SelectItem>
                                    <SelectItem value="60">Fast (60 wpm)</SelectItem>
                                    <SelectItem value="80">Very Fast (80 wpm)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {error && (
                            <div className="text-sm text-red-500 text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-sm text-muted-foreground text-center">
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