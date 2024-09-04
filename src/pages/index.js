// index.js
import { useState } from "react";
import { useSession } from "next-auth/react";
import SignInForm from "@/components/SignInForm";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import styles from "./index.module.css";
import Image from "next/image";

export default function Home() {
  const { data: session } = useSession();
  const [showSignInForm, setShowSignInForm] = useState(false);

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        <div className={styles.artPlaceholder}>
          <Image
            src="/images/heroVhs.webp"
            alt="Hero VHS Image"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className={styles.content}>
          <h1 className={styles.heading}>Mediaq</h1>
          {showSignInForm ? (
            <div className="formBox">
              <SignInForm />
              <button
                onClick={() => setShowSignInForm(false)}
                className={styles.cancel}
              >Cancel</button>
            </div>
          ) : (
            <>
              <p className={styles.description}>
                Welcome to Mediaq, your ultimate digital hub for organizing and planning your media consumption across books, movies, music, and more. Whether you&apos;re looking to entertain, educate, or enhance your business skills, Mediaq is designed to help you keep track of all your media interests in one convenient place. Explore a vast library of content using data from TMDB for movies, RAWG for games, Open Library, and Google Books for books. Fill your queue with everything you plan or want to watch, read, or play. Connect with friends and see what they&apos;re enjoying, making it easier to share recommendations and discover new favorites. Organize your media effortlessly and never lose track of your interests. Stay updated with the latest releases and trends in your favorite categories. Join Mediaq now and transform the way you manage your media consumption!
              </p>
              <div className={styles.actions}>
                {session ? (
                  <SignOutButton />
                ) : (
                  <button
                    onClick={() => setShowSignInForm(true)}
                    className={styles.signInButton}
                  >
                    Sign In
                  </button>
                )}
                <span>or</span>
                {session ? (
                  <Link className={styles.dashboardButton} href="/user-main">
                    Dashboard
                  </Link>
                ) : (
                  <Link href="/create-user" className={styles.signUpButton}>
                    Sign Up
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}