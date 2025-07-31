import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { FaSignOutAlt } from 'react-icons/fa';
import Popover from '../Popover';
import { useTokens } from '@/hooks/useTokens';
import TokenBalance from '@/components/tokens/TokenBalance';
import styles from './UserMenu.module.css';
import { LuCoins } from 'react-icons/lu';

export default function UserMenu() {
    const { data: session } = useSession();
    const { balance, loading } = useTokens();
    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        await signOut({ callbackUrl: '/login' });
    };

    const initials = (
        session?.user?.name
            ?.split(/\s+/)
            .map(w => w.charAt(0))
            .join('') ||
        session?.user?.email?.charAt(0) ||
        ''
    ).toUpperCase();

    const userLabel = session?.user?.name || session?.user?.email || '';

    return (
        <Popover
            className={styles.popoverOverride}
            isOpen={isOpen}
            onOpen={() => setIsOpen(true)}
            onClose={() => setIsOpen(false)}
            trigger={
                <button
                    className={styles.userButton}
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Открыть меню пользователя"
                >
                    <span className={styles.avatar}>{initials}</span>
                    <span className={styles.userName}>{userLabel}</span>
                </button>
            }
            content={
                <div className={styles.menu}>
                    <div className={styles.balance}>
                        <Link href="/payment" className={styles.balanceLink}>
                            <LuCoins className={styles.balanceIcon} />
                            <TokenBalance balance={balance} loading={loading} showIcon={false} />
                        </Link>
                    </div>
                    <button onClick={handleSignOut} className={styles.signOut} aria-label="Выйти">
                        <FaSignOutAlt size={14} className={styles.signOutIcon} />
                        <span>Выйти</span>
                    </button>
                    {/* <div className={styles.userEmail}>{userLabel}</div> */}
                </div>
            }
        />
    );
}
