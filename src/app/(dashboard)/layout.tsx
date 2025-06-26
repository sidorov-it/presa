'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import styles from './layout.module.css';
import {
    FaChalkboard,
    FaHome,
    FaPalette,
    FaTrash,
    FaCog,
    FaCreditCard,
    FaSignOutAlt,
    FaBars,
    FaTimes,
} from 'react-icons/fa';
import Logo from '@/components/icons/Logo/Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // const { data: session } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [previousPath, setPreviousPath] = useState<string | null>(null);

    // Track path changes to detect when leaving editor pages
    useEffect(() => {
        setPreviousPath(pathname);
    }, [pathname, previousPath]);

    const menuItems = [
        {
            label: 'Мои презентации',
            path: '/dashboard',
            icon: <FaHome size={20} />,
        },
        {
            label: 'Шаблоны',
            path: '/templates',
            icon: <FaChalkboard size={20} />,
        },
        {
            label: 'Темы',
            path: '/themes',
            icon: <FaPalette size={20} />,
        },
        {
            label: 'Корзина',
            path: '/trash',
            icon: <FaTrash size={20} />,
        },
        {
            label: 'Настройки',
            path: '/settings',
            icon: <FaCog size={20} />,
        },
        {
            label: 'Оплата',
            path: '/tokens',
            icon: <FaCreditCard size={20} />,
        },
    ];

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <div className={styles.container}>
            {/* Mobile sidebar toggle */}
            <div className={styles.mobileToggle}>
                <button onClick={toggleSidebar} className={styles.toggleButton}>
                    {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`${styles.sidebar}${sidebarOpen ? ` ${styles.sidebarOpen}` : ''}`}>
                <div className={styles.logo}>
                    <div className={styles.logoText}>
                        <Logo />
                    </div>
                </div>

                <nav className={styles.nav}>
                    {/* <div className={styles.userProfile}>
                        <div className={styles.userProfileCard}>
                            <div className={styles.userAvatar}>{session?.user?.name?.charAt(0)}</div>
                            <div>
                                <div className={styles.userName}>{session?.user?.name}</div>
                                <div className={styles.userEmail}>{session?.user?.email}</div>
                            </div>
                        </div>
                    </div> */}

                    {menuItems.map(item => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`${styles.menuItem}${isActive ? ` ${styles.menuItemActive}` : ''}`}
                            >
                                <span className={styles.menuIcon}>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <button onClick={handleSignOut} className={styles.signOutButton}>
                        <span className={styles.menuIcon}>
                            <FaSignOutAlt size={20} />
                        </span>
                        <span>Выйти</span>
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className={styles.mainContent}>
                <main className={styles.mainArea}>{children}</main>
            </div>
        </div>
    );
}
