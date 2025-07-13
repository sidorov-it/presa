import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaSignOutAlt } from 'react-icons/fa';
import { HiOutlineCreditCard } from 'react-icons/hi2';
import { Popover } from '../Popover';
import { useTokens } from '@/hooks/useTokens';
import TokenBalance from '@/components/tokens/TokenBalance';
import styles from './UserMenu.module.css';

export default function UserMenu() {
    const { data: session } = useSession();
    const { balance, loading } = useTokens();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    return (
        <Popover
            isOpen={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            trigger={
                <button
                    className={styles.userButton}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Открыть меню пользователя"
                >
                    <span className={styles.userName}>{session?.user?.name || session?.user?.email}</span>
                </button>
            }
            content={
                <div className={styles.menu}>
                    <div className={styles.balance}>
                        <Link href="/tokens" className={styles.balanceLink}>
                            <HiOutlineCreditCard className={styles.balanceIcon} />
                            <TokenBalance balance={balance} loading={loading} variant="compact" showIcon={false} />
                        </Link>
                    </div>
                    <button onClick={handleSignOut} className={styles.signOut} aria-label="Выйти">
                        <FaSignOutAlt size={14} className={styles.signOutIcon} />
                        <span>Выйти</span>
                    </button>
                </div>
            }
        />
    );
}
