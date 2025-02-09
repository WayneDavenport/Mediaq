'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from './NavBar.module.css'

export default function NavBar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()

    if (!session) return null

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContent}>
                <div className={styles.navLinks}>
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
                </div>

                <div className={styles.rightSection}>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="mr-4"
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    <h2 className="text-2xl font-bold">
                        Welcome, {session?.user?.username || session?.user?.email || 'User'}!
                    </h2>
                </div>
            </div>
        </nav>
    )
}
