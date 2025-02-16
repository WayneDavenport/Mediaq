'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, Mail, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import styles from './NavBar.module.css'
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown'

export default function NavBar() {
    const { data: session } = useSession()
    const pathname = usePathname()
    const { theme, setTheme } = useTheme()

    if (!session) return null

    // Get user's initials for avatar fallback
    const getInitials = () => {
        const name = session?.user?.username || session?.user?.email || ''
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

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

                <div className="flex items-center gap-4">
                    <NotificationsDropdown />
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? (
                            <Sun className="h-5 w-5" />
                        ) : (
                            <Moon className="h-5 w-5" />
                        )}
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session.user.image} alt={session.user.username || 'User'} />
                                    <AvatarFallback>{getInitials()}</AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {session.user.username || 'User'}
                                    </p>
                                    <p className="text-xs leading-none text-muted-foreground">
                                        {session.user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <Link href="/user-pages/settings">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <span onClick={() => signOut()}>Logout</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    )
}
