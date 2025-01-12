
'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Home() {
  const { data: session, status } = useSession()

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/' })
  }

  return (
    <div>
      <h1>Mediaq</h1>
      <p>Media Tracking App</p>

      {status === 'loading' ? (
        <p>Loading...</p>
      ) : session ? (
        <div>
          <Button onClick={handleSignOut}>Sign Out</Button>
          <Button asChild>
            <Link href="/user-pages/dashboard">Dashboard</Link>
          </Button>
        </div>
      ) : (
        <div>
          <Button asChild>
            <Link href="/auth-pages/signup">Sign Up</Link>
          </Button>
          <Button asChild>
            <Link href="/auth-pages/signin">Sign In</Link>
          </Button>
        </div>
      )}
    </div>
  )
}