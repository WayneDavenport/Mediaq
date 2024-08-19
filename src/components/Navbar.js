// src/components/Navbar.js
import Link from 'next/link';
import { useState } from 'react';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <Link href="/">
                        Mediaq
                    </Link>
                </div>
                <div className="navbar-toggle" onClick={toggleMenu}>
                    <div className="hamburger"></div>
                </div>
                <div className={`navbar-menu ${isOpen ? 'is-active' : ''}`}>
                    <Link className="navbar-item" href="/user-main">
                        User Main
                    </Link>
                    <Link className="navbar-item" href="/search">
                        Search
                    </Link>
                    <Link className="navbar-item" href="/media-gallery">
                        Media Gallery
                    </Link>
                    <Link className="navbar-item" href="/friend-search">
                        Friend Requests
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;