'use client';

import { Button, ButtonProps } from '@chakra-ui/react';
import Link from 'next/link';

interface LinkButtonProps extends Omit<ButtonProps, 'as'> {
    href: string;
    children: React.ReactNode;
}

export default function LinkButton({ href, children, ...buttonProps }: LinkButtonProps) {
    return (
        <Link href={href} style={{ textDecoration: 'none' }}>
            <Button {...buttonProps}>{children}</Button>
        </Link>
    );
}
