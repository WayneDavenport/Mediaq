import { signOut } from 'next-auth/react';

function SignOutButton() {
    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/' }); // Redirect to home page after sign out
    };

    return (
        <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={handleSignOut}>
            Sign Out
        </button>
    );
}

export default SignOutButton;