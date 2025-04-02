'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
    FaChalkboard,
    FaHome,
    FaPalette,
    FaTrash,
    FaCog,
    FaCreditCard,
    FaSignOutAlt,
    FaBars,
    FaTimes
} from 'react-icons/fa';

export default function DashboardLayout({
    children,
}: {
  children: React.ReactNode;
}) {
    const { data: session } = useSession();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const menuItems = [
        {
            label: 'Мои презентации',
            path: '/dashboard',
            icon: <FaHome size={20} />
        },
        {
            label: 'Шаблоны',
            path: '/templates',
            icon: <FaChalkboard size={20} />
        },
        {
            label: 'Темы',
            path: '/themes',
            icon: <FaPalette size={20} />
        },
        {
            label: 'Корзина',
            path: '/trash',
            icon: <FaTrash size={20} />
        },
        {
            label: 'Настройки',
            path: '/settings',
            icon: <FaCog size={20} />
        },
        {
            label: 'Оплата',
            path: '/payment',
            icon: <FaCreditCard size={20} />
        },
    ];

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile sidebar toggle */}
            <div className="lg:hidden fixed top-4 left-4 z-20">
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                >
                    {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                </button>
            </div>

            {/* Sidebar */}
            <div
                className={`${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 fixed inset-y-0 left-0 z-10 w-64 transition duration-300 transform bg-gray-800 overflow-y-auto lg:static lg:inset-0`}
            >
                <div className="flex items-center justify-center mt-8">
                    <div className="flex items-center">
                        <span className="text-white text-2xl font-semibold">Presa</span>
                    </div>
                </div>

                <nav className="mt-10">
                    <div className="px-4 mb-8">
                        <div className="flex items-center space-x-4 p-2 bg-gray-700 rounded-lg">
                            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {session?.user?.name?.charAt(0)}
                            </div>
                            <div>
                                <div className="text-white font-medium">{session?.user?.name}</div>
                                <div className="text-gray-300 text-sm truncate">{session?.user?.email}</div>
                            </div>
                        </div>
                    </div>

                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center px-6 py-3 text-gray-100 hover:bg-gray-700 ${
                                    isActive ? 'bg-gray-700' : ''
                                }`}
                            >
                                <span className="mr-3">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}

                    <button
                        onClick={handleSignOut}
                        className="flex items-center px-6 py-3 mt-10 text-gray-100 hover:bg-gray-700 w-full"
                    >
                        <span className="mr-3"><FaSignOutAlt size={20} /></span>
                        <span>Выйти</span>
                    </button>
                </nav>
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    {children}
                </main>
            </div>
        </div>
    );
}