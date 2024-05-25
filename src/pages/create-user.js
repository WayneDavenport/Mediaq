// src/pages/create-user.js
import Link from "next/link";
import SignUpForm from "@/components/SignUpForm";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from "react";

const CreateUser = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === 'authenticated') {
            alert('You are already signed in!');
            router.push('/'); // Redirect to home page or any other page
        }
    }, [status, router]);

    if (status === 'authenticated') {
        return null; // Render nothing while redirecting
    }

    return (
        <div>
            <h1>User Creation</h1>
            <SignUpForm />
        </div>
    );
};

export default CreateUser;