'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Phone, Coffee } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            toast.success("Your message has been sent! We'll get back to you soon.");
            setFormData({
                name: '',
                email: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            toast.error(error.message || "There was an error sending your message. Please try again.");
            console.error("Contact form error:", error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold mb-8">Contact Us</h1>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>
                    <p className="text-muted-foreground mb-6">
                        We'd love to hear from you. Fill out the form and we'll get back to you as soon as possible.
                    </p>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 mt-0.5 text-primary" />
                            <div>
                                <h3 className="font-medium">Email</h3>
                                <a href="mailto:wayne@mediaq.io" className="text-muted-foreground hover:text-primary">
                                    wayne@mediaq.io
                                </a>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 mt-0.5 text-primary" />
                            <div>
                                <h3 className="font-medium">Phone</h3>
                                <a href="tel:9792357001" className="text-muted-foreground hover:text-primary">
                                    (979) 235-7001
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8">
                        <h3 className="font-medium mb-2">About MediaQ</h3>
                        <p className="text-muted-foreground">
                            MediaQ helps you track and manage your media consumption.
                            Our mission is to help users discover new content and make the most of their entertainment time.
                        </p>

                        <div className="mt-6 border-t pt-4 border-border">
                            <h4 className="text-sm font-medium mb-2">Support MediaQ</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Thank you for trying MediaQ! If you're enjoying the app and would like to help with the initial development costs, buying me a coffee would be greatly appreciated. ☕
                            </p>
                            <div className="flex items-start">
                                <a
                                    href="https://www.buymeacoffee.com/wainiaq"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#5F7FFF] text-white hover:bg-[#4F6FEF] transition-colors font-medium"
                                >
                                    <Coffee className="h-4 w-4" />
                                    Buy me a coffee
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg p-6 border">
                    <h2 className="text-xl font-semibold mb-4">Send a Message</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium mb-1">
                                Your Name
                            </label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-1">
                                Email Address
                            </label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium mb-1">
                                Subject
                            </label>
                            <Input
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium mb-1">
                                Message
                            </label>
                            <Textarea
                                id="message"
                                name="message"
                                rows={4}
                                value={formData.message}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={submitting}>
                            {submitting ? 'Sending...' : 'Send Message'}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
} 