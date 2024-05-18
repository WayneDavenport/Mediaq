import { signIn } from 'next-auth/react';
import { useRouter } from 'next/router';

function SignInForm() {

    const router = useRouter();
    const handleSubmit = async (event) => {
        event.preventDefault();
        const email = event.target.email.value;
        const password = event.target.password.value;

        const result = await signIn('credentials', {
            redirect: false, // Set to true if you want to redirect the user to another page upon successful sign-in
            email,
            password
        });

        if (!result.error) {
            // Handle success case
            console.log("You're signed in!");
            router.push('/user-main');
        } else {
            // Handle errors
            console.error(result.error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email:</label>
            <input name="email" type="text" required />
            <label htmlFor="password">Password:</label>
            <input name="password" type="password" required />
            <button type="submit">Sign In</button>
        </form>
    );
}

export default SignInForm;