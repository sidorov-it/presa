'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './layout.module.css';
import {
    FaChalkboard,
    FaHome,
    FaPalette,
    FaTrash,
    FaCog,
    FaCreditCard,
    FaBars,
    FaTimes,
    FaComment,
} from 'react-icons/fa';
import Logo from '@/components/icons/Logo/Logo';
import UserMenu from '@/components/ui/UserMenu/UserMenu';
import Footer from '@/components/ui/Footer';
import { Tooltip } from '@/components/ui/tooltip';
import { LuInfo } from 'react-icons/lu';
import { useEarlyTestBanner } from '@/contexts/EarlyTestBannerContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // const { data: session } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [previousPath, setPreviousPath] = useState<string | null>(null);
    const { isVisible: isEarlyTestBannerVisible } = useEarlyTestBanner();

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
        {
            label: 'Обратная связь',
            path: 'https://forms.yandex.ru/u/6879f43890fa7b0b0f2f43f1',
            tooltip: 'Поделиться мнением, предложить недостающий функционал, рассказать о проблемах',
            icon: <FaComment size={20} />,
        },
    ];

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <>
            <div className={styles.wrapper}>
                {/* Mobile header */}
                <header className={styles.mobileHeader}>
                    <div className={styles.mobileHeaderContent}>
                        <span className={styles.mobileLogo}>
                            <Logo size="sm" href="/dashboard" />
                        </span>
                        <button onClick={toggleSidebar} className={styles.toggleButton} aria-label="Открыть меню">
                            {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </header>

                <div className={styles.container}>
                    {/* Sidebar */}
                    <div
                        className={`${styles.sidebar}${sidebarOpen ? ` ${styles.sidebarOpen}` : ''} ${
                            isEarlyTestBannerVisible ? ` ${styles.sidebarWithBanner}` : ''
                        }`}
                    >
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

                            <div className={styles.menu}>
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
                                            {item.tooltip && (
                                                <Tooltip content={item.tooltip}>
                                                    <span style={{ marginLeft: '6px' }}>
                                                        <LuInfo />
                                                    </span>
                                                </Tooltip>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>

                            <UserMenu />
                        </nav>
                    </div>

                    {/* Main content */}
                    <div className={styles.mainContent}>
                        <main className={styles.mainArea}>
                            <div className={styles.contentWrapper}>{children}</div>
                        </main>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
}
