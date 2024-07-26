import { useState } from "react";
import { useSession } from "next-auth/react";
import SignInForm from "@/components/SignInForm";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const [showSignInForm, setShowSignInForm] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex  ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 p-8">
        <div className="flex flex-col  items-start space-x-12 space-y-10">
          <h1 className="text-9xl mx-10 font-bold text-gray-800 mt-20 mb-8">Mediaq</h1>
          {showSignInForm ? (
            <SignInForm />
          ) : (
            <>
              <p className="text-lg text-gray-600 max-w-xl ">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.orem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.orem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.orem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>
              <div className="  space-x-8  ">
                <button
                  onClick={() => setShowSignInForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded"
                >
                  Sign In
                </button>
                <span>or</span>
                <Link href="/create-user" className="px-4 py-2 bg-green-500 text-white rounded">
                  Sign Up
                </Link>
              </div>
            </>
          )}
        </div>
        <div className="flex items-center justify-center" >
          {/* Placeholder for the art */}
          <div className="w-full h-96 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    </div>
  );
}