'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import styles from './styles.module.css'

export default function Home() {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

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
          <p className={styles.description}>
            Welcome to Mediaq, your ultimate digital hub for organizing and planning your media consumption across books, movies, music, and more. Whether you&apos;re looking to entertain, educate, or enhance your business skills, Mediaq is designed to help you keep track of all your media interests in one convenient place. Explore a vast library of content using data from TMDB for movies, RAWG for games, Open Library, and Google Books for books. Fill your queue with everything you plan or want to watch, read, or play. Connect with friends and see what they&apos;re enjoying, making it easier to share recommendations and discover new favorites. Organize your media effortlessly and never lose track of your interests. Stay updated with the latest releases and trends in your favorite categories. Join Mediaq now and transform the way you manage your media consumption!
          </p>

          {status === 'loading' ? (
            <p>Loading...</p>
          ) : (
            <div className={styles.actions}>
              {session ? (
                <>
                  <Button onClick={handleSignOut}>Sign Out</Button>
                  <span>or</span>
                  <Button asChild>
                    <Link href="/user-pages/dashboard">Dashboard</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link href="/auth-pages/signin">Sign In</Link>
                  </Button>
                  <span>or</span>
                  <Button asChild>
                    <Link href="/auth-pages/signup">Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}