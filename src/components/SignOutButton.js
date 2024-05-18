import { signOut } from 'next-auth/react';

function SignOutButton() {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' }); // Redirect to home page after sign out
    };

    return (
        <button onClick={handleSignOut}>
            Sign Out
        </button>
    );
}

export default SignOutButton;