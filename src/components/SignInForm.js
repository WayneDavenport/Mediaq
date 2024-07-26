import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

function SignInForm() {
    const router = useRouter();
    const handleSubmit = async (event) => {
        event.preventDefault();
        const email = event.target.email.value;
        const password = event.target.password.value;

        const result = await signIn('credentials', {
            redirect: false,
            email,
            password
        });

        if (!result.error) {
            console.log("You're signed in!");
            router.push('/user-main');
        } else {
            console.error(result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-gray-700">Email:</label>
                <input
                    name="email"
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-gray-700">Password:</label>
                <input
                    name="password"
                    type="password"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <button
                type="submit"
                className="w-full px-4 py-2 bg-blue-500 text-white rounded"
            >
                Sign In
            </button>
        </form>
    );
}

export default SignInForm;