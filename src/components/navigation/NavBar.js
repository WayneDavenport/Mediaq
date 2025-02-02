'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './NavBar.module.css'

export default function NavBar() {
    const { data: session } = useSession()
    const pathname = usePathname()

    if (!session) return null

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContent}>
                <Link
                    href="/"
                    className={pathname === '/' ? styles.active : ''}
                >
                    Home

                </Link>
                <Link
                    href="/user-pages/dashboard"
                    className={pathname === '/user-pages/dashboard' ? styles.active : ''}

                >
                    Dashboard
                </Link>
                <Link
                    href="/user-pages/gallery"
                    className={pathname === '/user-pages/gallery' ? styles.active : ''}
                >
                    Gallery
                </Link>
                <Link
                    href="/user-pages/search"
                    className={pathname === '/user-pages/search' ? styles.active : ''}
                >
                    Search
                </Link>
                <Link
                    href="/user-pages/social"
                    className={pathname === '/user-pages/social' ? styles.active : ''}
                >
                    Social
                </Link>
                <h2 className="text-2xl font-bold mb-6">
                    Welcome, {session?.user?.username || session?.user?.email || 'User'}!
                </h2>
            </div>
        </nav>
    )
}
