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
          <h1 className={styles.heading}>
            Mediaq
            <span className={styles.betaTag}>&lt;Beta&gt;</span>
          </h1>
          <div className={styles.maintenanceNotice}>
            ⚠️ Notice: We recently experienced a database reset. If you previously created an account, you'll need to sign up again. We apologize for any inconvenience as we continue to improve our service.
          </div>
          <p className={styles.description}>
            Welcome to Mediaq, your central hub for organizing your movies, books, video games, and more.  Keep track of everything you want to watch, read, or play in one convenient place.  Explore a vast library of content, fill your queue, and connect with friends to share recommendations and discover new favorites.  Organize your media effortlessly and stay updated on the latest releases. Join Mediaq and transform how you manage your media!
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