'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Moon, Sun, Menu, X, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
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
    const [isOpen, setIsOpen] = useState(false)

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

    // Base navigation links - removed "Home" since we're replacing it with the logo
    const navLinks = [
        { href: '/user-pages/dashboard', label: 'Dashboard' },
        { href: '/user-pages/gallery', label: 'Gallery' },
        { href: '/user-pages/search', label: 'Search' },
        { href: '/user-pages/social', label: 'Social' },
        { href: '/contact', label: 'Contact' },
    ]

    // Add admin link if user is an admin
    if (session.user.isAdmin) {
        navLinks.push({
            href: '/admin',
            label: 'Admin',
            icon: <ShieldAlert className="h-4 w-4 mr-2" />
        });
    }

    // Add a signOut handler function near your other functions
    const handleSignOut = async () => {
        await signOut({ redirect: true, callbackUrl: '/' })
    }

    // Add theme toggle and signout to mobile menu for easier access
    const mobileMenuItems = [
        ...navLinks,
        {
            href: '#theme-toggle',
            label: theme === 'dark' ? 'Light Mode' : 'Dark Mode',
            icon: theme === 'dark' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />,
            onClick: () => setTheme(theme === 'dark' ? 'light' : 'dark')
        },
        {
            href: '#sign-out',
            label: 'Sign Out',
            onClick: handleSignOut
        }
    ];

    return (
        <nav className={styles.navbar}>
            <div className={styles.navContent}>
                {/* Mobile Menu Button */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                    <SheetTrigger asChild className="lg:hidden">
                        <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Toggle menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                        <SheetHeader>
                            <SheetTitle>Menu</SheetTitle>
                        </SheetHeader>
                        <div className="flex flex-col space-y-4 mt-4">
                            {/* Add Logo to mobile menu */}
                            <Link
                                href="/user-pages/dashboard"
                                className="flex items-center px-4 py-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <div className={styles.logoCircle}>Mq</div>
                                <span className="ml-2 font-medium">Home</span>
                            </Link>

                            {/* Mobile menu items */}
                            {mobileMenuItems.map((item, index) => (
                                <div key={index}>
                                    {item.onClick ? (
                                        <button
                                            className={`px-4 py-2 rounded-md transition-colors flex items-center w-full text-left
                                                ${item.href === pathname ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}
                                                ${item.label === 'Admin' ? 'text-amber-500 font-medium' : ''}
                                            `}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                item.onClick();
                                                setIsOpen(false);
                                            }}
                                        >
                                            {item.icon && item.icon}
                                            {item.label}
                                        </button>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={`px-4 py-2 rounded-md transition-colors flex items-center
                                                ${item.href === pathname ? 'bg-primary/10 text-primary' : 'hover:bg-accent'}
                                                ${item.label === 'Admin' ? 'text-amber-500 font-medium' : ''}
                                            `}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            {item.icon && item.icon}
                                            {item.label}
                                        </Link>
                                    )}
                                </div>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Logo (visible on all screen sizes) */}
                <div className={styles.logoContainer}>
                    <Link href="/user-pages/dashboard">
                        <div className={styles.logoCircle}>Mq</div>
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className={`${styles.navLinks} hidden lg:flex`}>
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center ${pathname === link.href ? styles.active : ''} 
                                       ${link.label === 'Admin' ? 'text-amber-500 font-medium' : ''}`}
                        >
                            {link.icon && link.icon}
                            {link.label}
                        </Link>
                    ))}
                </div>

                {/* Right Section - Only show avatar on mobile, full controls on desktop */}
                <div className="flex items-center gap-2">
                    {/* Only show on desktop */}
                    <div className="hidden lg:flex items-center gap-2 sm:gap-4">
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
                    </div>

                    {/* Avatar dropdown - show on all screen sizes */}
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
                            {session.user.isAdmin && (
                                <DropdownMenuItem>
                                    <Link href="/admin" className="w-full flex items-center">
                                        <ShieldAlert className="h-4 w-4 mr-2" />
                                        Admin Dashboard
                                    </Link>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                                <Link href="/user-pages/settings" className="w-full">Settings</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <Link href="/legal/affiliate-disclosure" className="w-full">Legal Information</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleSignOut}>
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </nav>
    )
}
