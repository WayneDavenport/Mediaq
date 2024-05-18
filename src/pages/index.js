import { useSession } from "next-auth/react";
import SignInForm from "@/components/SignInForm";
import Link from "next/link";



export default function Home() {
  const { data: session } = useSession();
  return (
    <>
      <div>
        <h1>Home</h1>
        <br />
        <Link href='/create-user'>Create New Account!</Link>
        <br />
        <br />
        <h2>Sign In</h2>
        <SignInForm />
        {session && (
          <Link href='/user-main'>User Main Page</Link>
        )}

      </div>
    </>
  );
}
