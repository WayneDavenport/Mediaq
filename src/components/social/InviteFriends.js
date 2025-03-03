'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Mail, UserPlus, Check, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function InviteFriends() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [invitedEmails, setInvitedEmails] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/invite-friend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send invitation');
            }

            // Add email to invited list
            setInvitedEmails(prev => [...prev, email]);
            setEmail('');
            toast.success('Invitation sent successfully!');
        } catch (error) {
            console.error('Error sending invitation:', error);
            toast.error(error.message || 'Failed to send invitation');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Invite Friends to MediaQ
                </CardTitle>
                <CardDescription>
                    Share MediaQ with your friends and help them organize their media collections
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                            Friend's Email
                        </label>
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                                id="email"
                                type="email"
                                placeholder="friend@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                className="flex-1"
                            />
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Invite'}
                            </Button>
                        </div>
                    </div>

                    {invitedEmails.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Recently Invited</h4>
                            <div className="space-y-1">
                                {invitedEmails.map((invitedEmail, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Check className="h-4 w-4 text-green-500" />
                                        {invitedEmail}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </form>
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t pt-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Powered by SendGrid
                </div>
                <div className="flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    <span>We'll never spam your friends</span>
                </div>
            </CardFooter>
        </Card>
    );
} 